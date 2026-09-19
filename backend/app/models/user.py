from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    target_daily_hours = db.Column(db.Float, default=6.0)
    current_streak = db.Column(db.Integer, default=0)
    best_streak = db.Column(db.Integer, default=0)
    last_study_date = db.Column(db.String(10), nullable=True)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    courses = db.relationship("Course", backref="user", lazy=True, cascade="all, delete-orphan")
    exams = db.relationship("Exam", backref="user", lazy=True, cascade="all, delete-orphan")
    study_sessions = db.relationship("StudySession", backref="user", lazy=True, cascade="all, delete-orphan")
    reading_items = db.relationship("ReadingItem", backref="user", lazy=True, cascade="all, delete-orphan")
    goals = db.relationship("Goal", backref="user", lazy=True, cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")
    mistakes = db.relationship("Mistake", backref="user", lazy=True, cascade="all, delete-orphan")
    revisions = db.relationship("Revision", backref="user", lazy=True, cascade="all, delete-orphan")
    notes = db.relationship("Note", backref="user", lazy=True, cascade="all, delete-orphan")
    achievements = db.relationship("Achievement", backref="user", lazy=True, cascade="all, delete-orphan")
    reflections = db.relationship("DailyReflection", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        # Support fallback to plaintext "admin" for initial default admin setup if needed
        if self.password_hash == password:
            return True
        return check_password_hash(self.password_hash, password)

    def total_study_hours(self):
        total_mins = sum(s.duration_minutes for s in self.study_sessions)
        return round(total_mins / 60.0, 1)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username or self.email.split('@')[0],
            "email": self.email,
            "is_admin": bool(self.is_admin),
            "target_daily_hours": self.target_daily_hours,
            "current_streak": self.current_streak,
            "best_streak": self.best_streak,
            "last_study_date": self.last_study_date,
            "xp": self.xp,
            "level": self.level,
            "total_study_hours": self.total_study_hours(),
            "total_sessions": len(self.study_sessions),
            "created_at": self.created_at.strftime("%Y-%m-%d") if self.created_at else None
        }
