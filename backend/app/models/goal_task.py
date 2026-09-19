from datetime import datetime
from app.extensions import db

class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(50), nullable=False) # Daily, Weekly, Monthly, Exam, Course
    title = db.Column(db.String(150), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, default=0.0)
    unit = db.Column(db.String(30), default="hours") # hours, questions, pages, mocks, topics
    period = db.Column(db.String(30), default="daily") # daily, weekly, monthly, custom
    start_date = db.Column(db.String(10), nullable=True) # YYYY-MM-DD
    end_date = db.Column(db.String(10), nullable=True)
    status = db.Column(db.String(30), default="active") # active, completed, overdue
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def progress_pct(self):
        if self.target_value <= 0:
            return 0
        return min(100.0, round((self.current_value / self.target_value) * 100, 1))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "target_value": self.target_value,
            "current_value": self.current_value,
            "unit": self.unit,
            "period": self.period,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "progress_pct": self.progress_pct()
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.String(10), nullable=True) # YYYY-MM-DD
    status = db.Column(db.String(30), default="pending") # pending, in_progress, completed, deferred
    priority = db.Column(db.String(20), default="medium") # high, medium, low
    planned_minutes = db.Column(db.Integer, default=60)
    actual_minutes = db.Column(db.Integer, default=0)
    scheduled_time = db.Column(db.String(20), nullable=True) # e.g. "19:00 - 20:00"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship("Subject", backref="tasks", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "subject_color": self.subject.color if self.subject else "#6366F1",
            "title": self.title,
            "due_date": self.due_date,
            "status": self.status,
            "priority": self.priority,
            "planned_minutes": self.planned_minutes,
            "actual_minutes": self.actual_minutes,
            "scheduled_time": self.scheduled_time,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
