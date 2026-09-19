import json
from datetime import datetime
from app.extensions import db

class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)

    question_text = db.Column(db.Text, nullable=False)
    options_json = db.Column(db.Text, nullable=True) # JSON list of string options
    answer = db.Column(db.String(100), nullable=False) # e.g. "A" or exact answer
    explanation = db.Column(db.Text, nullable=True)
    year = db.Column(db.Integer, nullable=True) # e.g. 2023, 2024
    difficulty = db.Column(db.String(20), default="Medium") # Easy, Medium, Hard
    marks = db.Column(db.Float, default=2.0)
    negative_marks = db.Column(db.Float, default=0.66)
    source = db.Column(db.String(100), default="GATE CSE")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    attempts = db.relationship("QuestionAttempt", backref="question", lazy=True, cascade="all, delete-orphan")
    mistakes = db.relationship("Mistake", backref="question", lazy=True, cascade="all, delete-orphan")
    subject = db.relationship("Subject", backref="questions", lazy=True)
    topic = db.relationship("Topic", backref="questions", lazy=True)

    def get_options(self):
        if not self.options_json:
            return []
        try:
            return json.loads(self.options_json)
        except Exception:
            return []

    def accuracy_rate(self):
        if not self.attempts:
            return 0
        correct_count = sum(1 for a in self.attempts if a.correct)
        return round((correct_count / len(self.attempts)) * 100, 1)

    def to_dict(self):
        return {
            "id": self.id,
            "exam_id": self.exam_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "topic_id": self.topic_id,
            "topic_name": self.topic.name if self.topic else None,
            "question_text": self.question_text,
            "options": self.get_options(),
            "answer": self.answer,
            "explanation": self.explanation,
            "year": self.year,
            "difficulty": self.difficulty,
            "marks": self.marks,
            "negative_marks": self.negative_marks,
            "source": self.source,
            "accuracy_rate": self.accuracy_rate(),
            "total_attempts": len(self.attempts)
        }


class QuestionAttempt(db.Model):
    __tablename__ = "question_attempts"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    selected_answer = db.Column(db.String(100), nullable=True)
    correct = db.Column(db.Boolean, nullable=False, default=False)
    time_taken_seconds = db.Column(db.Integer, default=60)
    attempt_date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "user_id": self.user_id,
            "selected_answer": self.selected_answer,
            "correct": self.correct,
            "time_taken_seconds": self.time_taken_seconds,
            "attempt_date": self.attempt_date.isoformat() if self.attempt_date else None
        }
