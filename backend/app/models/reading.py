from datetime import datetime
from app.extensions import db

class ReadingItem(db.Model):
    __tablename__ = "reading_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), default="Book") # Book, PDF, Paper, Article, Notes
    author = db.Column(db.String(100), nullable=True)
    total_pages = db.Column(db.Integer, nullable=False, default=100)
    current_page = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(30), default="reading") # reading, completed, planned
    cover_color = db.Column(db.String(30), default="#3B82F6")
    last_read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sessions = db.relationship("ReadingSession", backref="item", lazy=True, cascade="all, delete-orphan")

    def progress_pct(self):
        if self.total_pages <= 0:
            return 0
        return min(100.0, round((self.current_page / self.total_pages) * 100, 1))

    def average_speed_pages_per_hour(self):
        if not self.sessions:
            return 0
        total_pages = sum(s.pages_read for s in self.sessions)
        total_minutes = sum(s.duration_minutes for s in self.sessions)
        if total_minutes <= 0:
            return 0
        return round((total_pages / total_minutes) * 60, 1)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "type": self.type,
            "author": self.author,
            "total_pages": self.total_pages,
            "current_page": self.current_page,
            "status": self.status,
            "cover_color": self.cover_color,
            "progress_pct": self.progress_pct(),
            "reading_speed_pph": self.average_speed_pages_per_hour(),
            "last_read_at": self.last_read_at.isoformat() if self.last_read_at else None,
            "session_count": len(self.sessions)
        }


class ReadingSession(db.Model):
    __tablename__ = "reading_sessions"

    id = db.Column(db.Integer, primary_key=True)
    reading_item_id = db.Column(db.Integer, db.ForeignKey("reading_items.id"), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, default=datetime.utcnow)
    duration_minutes = db.Column(db.Float, default=30.0)
    pages_read = db.Column(db.Integer, default=15)
    start_page = db.Column(db.Integer, default=0)
    end_page = db.Column(db.Integer, default=15)

    def to_dict(self):
        return {
            "id": self.id,
            "reading_item_id": self.reading_item_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "duration_minutes": self.duration_minutes,
            "pages_read": self.pages_read,
            "start_page": self.start_page,
            "end_page": self.end_page
        }
