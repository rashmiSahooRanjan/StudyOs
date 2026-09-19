from datetime import datetime
from app.extensions import db

class Mistake(db.Model):
    __tablename__ = "mistakes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)

    user_answer = db.Column(db.String(100), nullable=True)
    correct_answer = db.Column(db.String(100), nullable=True)
    reason = db.Column(db.String(100), default="concept gap") 
    # Valid reasons: "concept gap", "calculation error", "careless error", 
    # "misunderstood question", "memory issue", "time pressure", "guessed answer"
    
    concept_note = db.Column(db.Text, nullable=True)
    reviewed = db.Column(db.Boolean, default=False)
    reattempted = db.Column(db.Boolean, default=False)
    last_result = db.Column(db.String(20), default="unresolved") # unresolved, corrected, failed_again
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subject = db.relationship("Subject", backref="mistakes", lazy=True)
    topic = db.relationship("Topic", backref="mistakes", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "question_text": self.question.question_text if self.question else None,
            "options": self.question.get_options() if self.question else [],
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else (self.question.subject.name if self.question and self.question.subject else None),
            "topic_id": self.topic_id,
            "topic_name": self.topic.name if self.topic else (self.question.topic.name if self.question and self.question.topic else None),
            "user_answer": self.user_answer,
            "correct_answer": self.correct_answer or (self.question.answer if self.question else None),
            "explanation": self.question.explanation if self.question else None,
            "reason": self.reason,
            "concept_note": self.concept_note,
            "reviewed": self.reviewed,
            "reattempted": self.reattempted,
            "last_result": self.last_result,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
