from datetime import datetime
from app.extensions import db

class StudySession(db.Model):
    __tablename__ = "study_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)

    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Float, nullable=False, default=0.0) # in minutes
    mode = db.Column(db.String(50), default="Learning") # Learning, Revision, Practice, PYQ, Mock Test, Reading, Coding, Lecture, Assignment
    focus_rating = db.Column(db.Integer, default=4) # 1 to 5
    distraction_count = db.Column(db.Integer, default=0)
    distraction_notes = db.Column(db.String(255), nullable=True) # e.g. "Phone notification, noisy room"
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "exam_id": self.exam_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "subject_color": self.subject.color if self.subject else "#6366F1",
            "topic_id": self.topic_id,
            "topic_name": self.topic.name if self.topic else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_minutes": round(self.duration_minutes, 1),
            "mode": self.mode,
            "focus_rating": self.focus_rating,
            "distraction_count": self.distraction_count,
            "distraction_notes": self.distraction_notes,
            "notes": self.notes,
            "is_active": self.is_active,
            "date": self.start_time.strftime("%Y-%m-%d") if self.start_time else None
        }
