from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import Revision, Topic

INTERVAL_STAGES = [1, 3, 7, 14, 30]

def schedule_topic_revision(user_id, topic_id, question_id=None):
    """
    Schedules an initial spaced revision for a learned topic (Day +1).
    """
    tomorrow = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Check if active revision already exists
    existing = Revision.query.filter_by(
        user_id=user_id,
        topic_id=topic_id,
        status="pending"
    ).first()

    if existing:
        return existing

    new_rev = Revision(
        user_id=user_id,
        topic_id=topic_id,
        question_id=question_id,
        due_date=tomorrow,
        status="pending",
        interval_days=1,
        stage=1
    )
    db.session.add(new_rev)
    db.session.commit()
    return new_rev


def complete_revision_step(revision_id, user_id, quality="good"):
    """
    Advances or contracts the revision interval based on performance rating:
    quality: 'easy', 'good', 'hard', 'forgot'
    """
    rev = Revision.query.filter_by(id=revision_id, user_id=user_id).first()
    if not rev:
        return None

    rev.last_reviewed_at = datetime.utcnow()

    if quality == "forgot":
        # Reset to stage 1 (+1 day)
        rev.stage = 1
        rev.interval_days = 1
        rev.due_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        rev.status = "pending"
    elif quality == "hard":
        # Keep current interval or advance slightly
        next_days = max(1, int(rev.interval_days * 1.2))
        rev.interval_days = next_days
        rev.due_date = (date.today() + timedelta(days=next_days)).strftime("%Y-%m-%d")
        rev.status = "pending"
    else: # 'good' or 'easy'
        current_stage = rev.stage
        if current_stage < len(INTERVAL_STAGES):
            next_stage = current_stage + 1
            interval = INTERVAL_STAGES[next_stage - 1]
            if quality == "easy":
                interval = int(interval * 1.5)
            rev.stage = next_stage
            rev.interval_days = interval
            rev.due_date = (date.today() + timedelta(days=interval)).strftime("%Y-%m-%d")
            rev.status = "pending"
        else:
            # Fully mastered all 5 intervals
            rev.status = "completed"

    db.session.commit()
    return rev


def get_user_revision_summary(user_id):
    """
    Returns organized lists for the Revision page: Due Today, Overdue, Upcoming, Completed.
    """
    today_str = date.today().strftime("%Y-%m-%d")
    all_revs = Revision.query.filter_by(user_id=user_id).all()

    due_today = []
    overdue = []
    upcoming = []
    completed = []

    for r in all_revs:
        d = r.to_dict()
        if r.status == "completed":
            completed.append(d)
        elif r.due_date < today_str:
            overdue.append(d)
        elif r.due_date == today_str:
            due_today.append(d)
        else:
            upcoming.append(d)

    return {
        "due_today": due_today,
        "overdue": overdue,
        "upcoming": upcoming,
        "completed": completed,
        "total_active": len(due_today) + len(overdue) + len(upcoming)
    }
