from datetime import datetime
from app.extensions import db

class Achievement(db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    badge_key = db.Column(db.String(80), nullable=False) # e.g. "first_session", "streak_7", "pyq_century"
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(50), default="Award") # Lucide icon name
    category = db.Column(db.String(50), default="Milestone")
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "badge_key": self.badge_key,
            "title": self.title,
            "description": self.description,
            "icon": self.icon,
            "category": self.category,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None
        }


class DailyReflection(db.Model):
    __tablename__ = "daily_reflections"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    reflection = db.Column(db.Text, nullable=True)
    energy = db.Column(db.Integer, default=3) # 1 to 5
    focus = db.Column(db.Integer, default=3) # 1 to 5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date,
            "reflection": self.reflection,
            "energy": self.energy,
            "focus": self.focus,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
