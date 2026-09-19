from datetime import datetime
from app.extensions import db

class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.String(10), nullable=True) # YYYY-MM-DD
    target_date = db.Column(db.String(10), nullable=True)
    status = db.Column(db.String(50), default="active") # active, completed, archived
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subjects = db.relationship("Subject", backref="course", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_subjects=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date,
            "target_date": self.target_date,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "subject_count": len(self.subjects)
        }
        if include_subjects:
            data["subjects"] = [s.to_dict() for s in self.subjects]
        return data


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=True)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(20), nullable=True)
    color = db.Column(db.String(30), default="#6366F1")
    icon = db.Column(db.String(50), default="BookOpen")
    priority = db.Column(db.String(20), default="medium") # high, medium, low
    weightage = db.Column(db.Float, default=1.0) # Weight in exam / syllabus
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    topics = db.relationship("Topic", backref="subject", lazy=True, cascade="all, delete-orphan")
    study_sessions = db.relationship("StudySession", backref="subject", lazy=True)

    def calculate_progress(self):
        if not self.topics:
            return 0
        total_pct = sum(t.completion_pct for t in self.topics if t.parent_id is None)
        root_topics = [t for t in self.topics if t.parent_id is None]
        if not root_topics:
            return 0
        return round(total_pct / len(root_topics), 1)

    def to_dict(self, include_topics=False):
        data = {
            "id": self.id,
            "course_id": self.course_id,
            "exam_id": self.exam_id,
            "name": self.name,
            "code": self.code or self.name[:4].upper(),
            "color": self.color,
            "icon": self.icon,
            "priority": self.priority,
            "weightage": self.weightage,
            "progress": self.calculate_progress(),
            "topic_count": len(self.topics)
        }
        if include_topics:
            # Return nested topics
            root_topics = [t for t in self.topics if t.parent_id is None]
            data["topics"] = [t.to_dict(include_subtopics=True) for t in root_topics]
        return data


class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    status = db.Column(db.String(30), default="not_started") # not_started, in_progress, completed, mastered
    completion_pct = db.Column(db.Float, default=0.0) # 0 to 100%
    priority = db.Column(db.String(20), default="medium") # high, medium, low
    estimated_hours = db.Column(db.Float, default=3.0)
    weightage = db.Column(db.Float, default=1.0)
    last_studied_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subtopics = db.relationship(
        "Topic",
        backref=db.backref("parent", remote_side=[id]),
        lazy=True,
        cascade="all, delete-orphan"
    )
    study_sessions = db.relationship("StudySession", backref="topic", lazy=True)
    revisions = db.relationship("Revision", backref="topic", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_subtopics=False):
        data = {
            "id": self.id,
            "subject_id": self.subject_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "status": self.status,
            "completion_pct": self.completion_pct,
            "priority": self.priority,
            "estimated_hours": self.estimated_hours,
            "weightage": self.weightage,
            "last_studied_at": self.last_studied_at.isoformat() if self.last_studied_at else None
        }
        if include_subtopics:
            data["subtopics"] = [sub.to_dict(include_subtopics=True) for sub in self.subtopics]
        return data
