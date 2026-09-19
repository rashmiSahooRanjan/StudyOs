import json
import csv
import io
from app.extensions import db
from app.models import (
    User, Course, Subject, Topic, Exam, StudySession, ReadingItem,
    Goal, Task, Question, QuestionAttempt, MockTest, MockAttempt,
    Revision, Mistake, Note, Achievement, DailyReflection
)

def export_full_backup_json(user_id):
    """
    Exports all user data into a portable JSON structure for offline backup.
    """
    user = User.query.get(user_id)
    if not user:
        return {}

    backup = {
        "export_version": "1.0",
        "exported_at": str(db.func.current_timestamp()),
        "user": user.to_dict(),
        "courses": [c.to_dict(include_subjects=True) for c in user.courses],
        "exams": [e.to_dict(include_subjects=True) for e in user.exams],
        "study_sessions": [s.to_dict() for s in user.study_sessions],
        "reading_items": [r.to_dict() for r in user.reading_items],
        "goals": [g.to_dict() for g in user.goals],
        "tasks": [t.to_dict() for t in user.tasks],
        "mistakes": [m.to_dict() for m in user.mistakes],
        "revisions": [r.to_dict() for r in user.revisions],
        "notes": [n.to_dict() for n in user.notes],
        "achievements": [a.to_dict() for a in user.achievements],
        "reflections": [rf.to_dict() for rf in user.reflections]
    }
    return backup


def export_study_sessions_csv(user_id):
    """
    Generates a CSV string of all study sessions.
    """
    sessions = StudySession.query.filter_by(user_id=user_id).order_by(StudySession.start_time.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Date", "Subject", "Topic", "Duration (min)", "Mode", "Focus (1-5)", "Distractions", "Distraction Notes", "Notes"])
    for s in sessions:
        writer.writerow([
            s.id,
            s.start_time.strftime("%Y-%m-%d %H:%M") if s.start_time else "",
            s.subject.name if s.subject else "",
            s.topic.name if s.topic else "",
            round(s.duration_minutes, 1),
            s.mode,
            s.focus_rating,
            s.distraction_count,
            s.distraction_notes or "",
            s.notes or ""
        ])
    
    return output.getvalue()
