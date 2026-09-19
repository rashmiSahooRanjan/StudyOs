import json
from datetime import datetime
from app.extensions import db

class MockTest(db.Model):
    __tablename__ = "mock_tests"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False) # e.g. "Full Length Mock 1", "OS & DBMS Subject Test"
    total_marks = db.Column(db.Float, default=100.0)
    duration_minutes = db.Column(db.Integer, default=180) # 3 hours
    total_questions = db.Column(db.Integer, default=65)
    sections_json = db.Column(db.Text, nullable=True) # JSON list of sections: [{"name": "OS", "marks": 25}, ...]
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    attempts = db.relationship("MockAttempt", backref="mock_test", lazy=True, cascade="all, delete-orphan")

    def get_sections(self):
        if not self.sections_json:
            return []
        try:
            return json.loads(self.sections_json)
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "exam_id": self.exam_id,
            "exam_name": self.exam.name if self.exam else None,
            "title": self.title,
            "total_marks": self.total_marks,
            "duration_minutes": self.duration_minutes,
            "total_questions": self.total_questions,
            "sections": self.get_sections(),
            "attempt_count": len(self.attempts)
        }


class MockAttempt(db.Model):
    __tablename__ = "mock_attempts"

    id = db.Column(db.Integer, primary_key=True)
    mock_id = db.Column(db.Integer, db.ForeignKey("mock_tests.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    score = db.Column(db.Float, nullable=False)
    total_marks = db.Column(db.Float, default=100.0)
    correct_count = db.Column(db.Integer, default=0)
    wrong_count = db.Column(db.Integer, default=0)
    skipped_count = db.Column(db.Integer, default=0)
    time_taken_minutes = db.Column(db.Float, default=120.0)
    section_breakdown_json = db.Column(db.Text, nullable=True) # e.g. '{"OS": 82, "DBMS": 76, "CN": 71, "Math": 81}'
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def accuracy_pct(self):
        attempted = self.correct_count + self.wrong_count
        if attempted <= 0:
            return 0
        return round((self.correct_count / attempted) * 100, 1)

    def get_section_breakdown(self):
        if not self.section_breakdown_json:
            return {}
        try:
            return json.loads(self.section_breakdown_json)
        except Exception:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "mock_id": self.mock_id,
            "mock_title": self.mock_test.title if self.mock_test else None,
            "user_id": self.user_id,
            "score": self.score,
            "total_marks": self.total_marks,
            "correct_count": self.correct_count,
            "wrong_count": self.wrong_count,
            "skipped_count": self.skipped_count,
            "accuracy_pct": self.accuracy_pct(),
            "time_taken_minutes": round(self.time_taken_minutes, 1),
            "section_breakdown": self.get_section_breakdown(),
            "attempted_at": self.attempted_at.isoformat() if self.attempted_at else None,
            "date": self.attempted_at.strftime("%Y-%m-%d") if self.attempted_at else None
        }
