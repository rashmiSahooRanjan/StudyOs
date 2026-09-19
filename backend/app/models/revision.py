from datetime import datetime, date
from app.extensions import db

class Revision(db.Model):
    __tablename__ = "revisions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=True)
    due_date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    status = db.Column(db.String(30), default="pending") # pending, completed, overdue
    interval_days = db.Column(db.Integer, default=1) # 1, 3, 7, 14, 30
    stage = db.Column(db.Integer, default=1) # 1 to 5
    last_reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    question = db.relationship("Question", backref="revisions", lazy=True)

    def is_overdue(self):
        if self.status == "completed":
            return False
        today_str = date.today().strftime("%Y-%m-%d")
        return self.due_date < today_str

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "topic_id": self.topic_id,
            "topic_name": self.topic.name if self.topic else None,
            "subject_name": self.topic.subject.name if (self.topic and self.topic.subject) else None,
            "question_id": self.question_id,
            "due_date": self.due_date,
            "status": "overdue" if self.is_overdue() else self.status,
            "interval_days": self.interval_days,
            "stage": self.stage,
            "last_reviewed_at": self.last_reviewed_at.isoformat() if self.last_reviewed_at else None,
            "is_overdue": self.is_overdue()
        }


class Flashcard(db.Model):
    __tablename__ = "flashcards"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(20), default="medium") # easy, medium, hard
    reviews_count = db.Column(db.Integer, default=0)
    last_reviewed_at = db.Column(db.DateTime, nullable=True)
    next_review_date = db.Column(db.String(10), nullable=True)
    interval_days = db.Column(db.Integer, default=1)

    subject = db.relationship("Subject", backref="flashcards", lazy=True)
    topic = db.relationship("Topic", backref="flashcards", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "topic_id": self.topic_id,
            "topic_name": self.topic.name if self.topic else None,
            "front": self.front,
            "back": self.back,
            "difficulty": self.difficulty,
            "reviews_count": self.reviews_count,
            "last_reviewed_at": self.last_reviewed_at.isoformat() if self.last_reviewed_at else None,
            "next_review_date": self.next_review_date,
            "interval_days": self.interval_days
        }
