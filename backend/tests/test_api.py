import pytest
import json
from app import create_app
from app.config import Config
from app.extensions import db
from app.models import User, StudySession, Subject, Topic, Question, Mistake, Revision
from app.services.recommendations import generate_smart_recommendations
from app.services.analytics import compute_study_dna
from app.utils.helpers import generate_token

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(app):
    with app.app_context():
        user = User.query.filter_by(email="alex@studyos.local").first()
        token = generate_token(user.id)
        return {"Authorization": f"Bearer {token}"}

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["app"] == "StudyOS"

def test_dashboard_endpoint(client, auth_headers):
    res = client.get("/api/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert "today_study" in data
    assert "streak" in data
    assert "priorities" in data
    assert "alerts" in data
    assert data["streak"]["current"] >= 1

def test_admin_login(client):
    res = client.post("/api/auth/login", json={"email": "admin", "password": "admin"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["is_admin"] is True
    assert "token" in data

def test_recommendation_rules(app):
    with app.app_context():
        user = User.query.filter_by(email="alex@studyos.local").first()
        recommendations = generate_smart_recommendations(user.id)
        assert len(recommendations) > 0
        rule_ids = [r["rule_id"] for r in recommendations]
        # R1 (overdue revision) should be present
        assert "R1" in rule_ids

def test_new_user_zero_priorities(app):
    with app.app_context():
        new_u = User(
            name="Clean User",
            email="clean_test@studyos.local",
            username="clean_test",
            password_hash="test",
            target_daily_hours=5.0
        )
        db.session.add(new_u)
        db.session.commit()
        recs = generate_smart_recommendations(new_u.id)
        assert len(recs) == 0, f"New user must have 0 recommendations, got {recs}"

def test_study_dna(app):
    with app.app_context():
        user = User.query.filter_by(email="alex@studyos.local").first()
        dna = compute_study_dna(user.id)
        assert dna["total_study_hours"] > 0
        assert "peak_productive_period" in dna
        assert "highest_focus_subject" in dna

def test_question_attempt_and_mistake_book(client, app, auth_headers):
    with app.app_context():
        q = Question.query.first()
        assert q is not None

        # Submit an incorrect answer to test Mistake Book auto logging
        res = client.post(f"/api/questions/{q.id}/attempt", headers=auth_headers, json={
            "selected_answer": "Definitely Wrong Answer",
            "time_taken_seconds": 45,
            "mistake_reason": "careless error"
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data["correct"] is False
        assert data["mistake_logged"] is True

        # Verify mistake is logged in Mistake Book
        mistake_res = client.get("/api/mistakes", headers=auth_headers)
        assert mistake_res.status_code == 200
        mistakes_data = mistake_res.get_json()
        assert len(mistakes_data["mistakes"]) > 0

def test_study_session_logging(client, app, auth_headers):
    with app.app_context():
        sub = Subject.query.first()
        res = client.post("/api/study-sessions", headers=auth_headers, json={
            "subject_id": sub.id,
            "duration_minutes": 45.0,
            "mode": "Learning",
            "focus_rating": 5,
            "distraction_count": 0,
            "notes": "Testing focus session"
        })
        assert res.status_code == 201
        data = res.get_json()
        assert data["session"]["duration_minutes"] == 45.0
        assert data["earned_xp"] > 0
