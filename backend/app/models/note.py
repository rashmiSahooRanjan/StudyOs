from datetime import datetime
from app.extensions import db

class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)

    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=True) # Markdown text
    resource_type = db.Column(db.String(50), default="Note") # Note, PDF, Book, Web, Lecture, Formula
    url = db.Column(db.String(500), nullable=True)
    tags = db.Column(db.String(200), nullable=True) # comma-separated tags e.g. "os,algorithms,gate"
    pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subject = db.relationship("Subject", backref="notes", lazy=True)
    topic = db.relationship("Topic", backref="notes", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "topic_id": self.topic_id,
            "topic_name": self.topic.name if self.topic else None,
            "title": self.title,
            "content": self.content,
            "resource_type": self.resource_type,
            "url": self.url,
            "tags": [t.strip() for t in self.tags.split(",")] if self.tags else [],
            "pinned": self.pinned,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
