from datetime import datetime, date
from app.extensions import db

class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False) # e.g. "GATE CSE 2027", "UPSC CSE"
    exam_date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    target_score = db.Column(db.Float, nullable=True) # e.g. 75.0
    target_rank = db.Column(db.Integer, nullable=True) # e.g. 100
    revision_strategy = db.Column(db.String(100), default="spaced_repetition")
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    subjects = db.relationship("Subject", backref="exam", lazy=True, cascade="all, delete-orphan")
    mock_tests = db.relationship("MockTest", backref="exam", lazy=True, cascade="all, delete-orphan")
    questions = db.relationship("Question", backref="exam", lazy=True, cascade="all, delete-orphan")

    def days_remaining(self):
        try:
            target = datetime.strptime(self.exam_date, "%Y-%m-%d").date()
            today = date.today()
            delta = (target - today).days
            return max(0, delta)
        except Exception:
            return 0

    def calculate_syllabus_completion(self):
        if not self.subjects:
            return 0
        total = sum(s.calculate_progress() for s in self.subjects)
        return round(total / len(self.subjects), 1)

    def to_dict(self, include_subjects=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "exam_date": self.exam_date,
            "target_score": self.target_score,
            "target_rank": self.target_rank,
            "revision_strategy": self.revision_strategy,
            "notes": self.notes,
            "status": self.status,
            "days_remaining": self.days_remaining(),
            "syllabus_completion": self.calculate_syllabus_completion(),
            "subject_count": len(self.subjects)
        }
        if include_subjects:
            data["subjects"] = [s.to_dict(include_topics=True) for s in self.subjects]
        return data
