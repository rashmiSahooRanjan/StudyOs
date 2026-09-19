import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import MockTest, MockAttempt, Exam
from app.utils.helpers import require_auth

mock_bp = Blueprint("mocks", __name__, url_prefix="/api/mocks")

@mock_bp.route("", methods=["GET"])
@require_auth
def get_mock_tests(current_user):
    exam_id = request.args.get("exam_id", type=int)
    query = MockTest.query
    if exam_id:
        query = query.filter_by(exam_id=exam_id)
    tests = query.all()
    return jsonify({"mock_tests": [t.to_dict() for t in tests]})


@mock_bp.route("", methods=["POST"])
@require_auth
def create_mock_test(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    exam_id = data.get("exam_id")
    if not title or not exam_id:
        return jsonify({"error": "Title and exam_id are required"}), 400

    sections = data.get("sections", [])
    mock = MockTest(
        exam_id=exam_id,
        title=title,
        total_marks=float(data.get("total_marks", 100.0)),
        duration_minutes=int(data.get("duration_minutes", 180)),
        total_questions=int(data.get("total_questions", 65)),
        sections_json=json.dumps(sections) if sections else None
    )
    db.session.add(mock)
    db.session.commit()
    return jsonify({"message": "Mock test created", "mock_test": mock.to_dict()}), 201


@mock_bp.route("/<int:mock_id>/attempt", methods=["POST"])
@require_auth
def submit_mock_attempt(current_user, mock_id):
    mock = db.session.get(MockTest, mock_id)
    if not mock:
        return jsonify({"error": "Mock test not found"}), 404

    data = request.get_json() or {}
    score = float(data.get("score", 0.0))
    correct = int(data.get("correct_count", 0))
    wrong = int(data.get("wrong_count", 0))
    skipped = int(data.get("skipped_count", 0))
    time_taken = float(data.get("time_taken_minutes", 120.0))
    section_breakdown = data.get("section_breakdown", {})

    attempt = MockAttempt(
        mock_id=mock.id,
        user_id=current_user.id,
        score=score,
        total_marks=mock.total_marks,
        correct_count=correct,
        wrong_count=wrong,
        skipped_count=skipped,
        time_taken_minutes=time_taken,
        section_breakdown_json=json.dumps(section_breakdown) if section_breakdown else None,
        attempted_at=datetime.utcnow()
    )
    db.session.add(attempt)

    # Award XP for completing a mock test
    current_user.xp += 100
    db.session.commit()

    return jsonify({
        "message": "Mock test attempt recorded",
        "attempt": attempt.to_dict()
    }), 201


@mock_bp.route("/history", methods=["GET"])
@require_auth
def get_mock_history(current_user):
    attempts = MockAttempt.query.filter_by(user_id=current_user.id)\
        .order_by(MockAttempt.attempted_at.desc()).all()

    # Identify recurring weak sections across tests
    section_scores = {}
    for att in attempts:
        bd = att.get_section_breakdown()
        for sec, val in bd.items():
            if sec not in section_scores:
                section_scores[sec] = []
            section_scores[sec].append(val)

    weak_sections = []
    for sec, scores in section_scores.items():
        avg_score = sum(scores) / len(scores)
        if avg_score < 70:
            weak_sections.append({"section": sec, "average_score": round(avg_score, 1)})

    return jsonify({
        "attempts": [a.to_dict() for a in attempts],
        "weak_sections": weak_sections,
        "total_mocks_taken": len(attempts)
    })
