from datetime import datetime, date, timedelta
from flask import Blueprint, jsonify
from collections import defaultdict
from app.extensions import db
from app.models import StudySession, Subject, Revision, Exam, Goal, Task, Course
from app.utils.helpers import require_auth
from app.services.recommendations import generate_smart_recommendations

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("", methods=["GET"])
@dashboard_bp.route("/today", methods=["GET"])
@require_auth
def get_dashboard(current_user):
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")

    # 1. Today's Study Sessions
    today_sessions = StudySession.query.filter(
        StudySession.user_id == current_user.id,
        StudySession.start_time >= datetime.combine(today, datetime.min.time()),
        StudySession.start_time <= datetime.combine(today, datetime.max.time())
    ).all()

    today_minutes = sum(s.duration_minutes for s in today_sessions)
    today_hours = today_minutes / 60.0
    goal_hours = current_user.target_daily_hours or 6.0
    progress_pct = min(100.0, round((today_hours / goal_hours) * 100, 1)) if goal_hours > 0 else 0

    # 2. Subject Time Breakdown Today
    subj_map = defaultdict(float)
    subj_colors = {}
    for s in today_sessions:
        if s.subject:
            subj_map[s.subject.name] += s.duration_minutes
            subj_colors[s.subject.name] = s.subject.color

    subject_time = []
    for name, mins in subj_map.items():
        hrs = int(mins // 60)
        rem_m = int(mins % 60)
        subject_time.append({
            "subject": name,
            "display": f"{hrs:02d}h {rem_m:02d}m",
            "minutes": round(mins, 1),
            "color": subj_colors.get(name, "#6366F1")
        })
    subject_time.sort(key=lambda x: x["minutes"], reverse=True)

    # 3. Active Alerts
    alerts = []
    # Check overdue revisions
    overdue_count = Revision.query.filter(
        Revision.user_id == current_user.id,
        Revision.status != "completed",
        Revision.due_date < today_str
    ).count()
    if overdue_count > 0:
        alerts.append({
            "type": "warning",
            "text": f"{overdue_count} spaced {'revisions' if overdue_count > 1 else 'revision'} overdue"
        })

    # Check unstudied subjects > 7 days (user's own subjects only)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    user_courses = Course.query.filter_by(user_id=current_user.id).all()
    user_exams = Exam.query.filter_by(user_id=current_user.id).all()
    u_c_ids = [c.id for c in user_courses]
    u_e_ids = [e.id for e in user_exams]
    user_subs = Subject.query.filter(
        (Subject.user_id == current_user.id) |
        (Subject.course_id.in_(u_c_ids) if u_c_ids else False) |
        (Subject.exam_id.in_(u_e_ids) if u_e_ids else False)
    ).all()

    for sub in user_subs:
        last_s = StudySession.query.filter(
            StudySession.user_id == current_user.id,
            StudySession.subject_id == sub.id
        ).order_by(StudySession.start_time.desc()).first()
        if last_s and last_s.start_time < seven_days_ago:
            days_inactive = (datetime.utcnow() - last_s.start_time).days
            alerts.append({
                "type": "info",
                "text": f"{sub.name} not studied for {days_inactive} days"
            })
            break # only show the top unstudied subject alert

    # Check upcoming exam within 30 days
    nearest_exam = Exam.query.filter(
        Exam.user_id == current_user.id,
        Exam.status == "active"
    ).all()
    for ex in nearest_exam:
        days_left = ex.days_remaining()
        if 0 < days_left <= 30:
            alerts.append({
                "type": "urgent",
                "text": f"{ex.name} in {days_left} days! Target score: {ex.target_score}"
            })
            break

    # 4. Today's Priorities (Smart Rule Engine)
    priorities = generate_smart_recommendations(current_user.id)

    # 5. Recent Sessions (last 5)
    recent_sessions = StudySession.query.filter_by(user_id=current_user.id)\
        .order_by(StudySession.start_time.desc()).limit(5).all()

    # 6. Active tasks due today
    tasks_today = Task.query.filter(
        Task.user_id == current_user.id,
        Task.due_date == today_str
    ).all()

    return jsonify({
        "today_study": {
            "minutes": round(today_minutes, 1),
            "hours": round(today_hours, 2),
            "display": f"{int(today_minutes // 60):02d}h {int(today_minutes % 60):02d}m",
            "goal_hours": goal_hours,
            "goal_display": f"{int(goal_hours):02d}h {int((goal_hours % 1) * 60):02d}m",
            "progress_pct": progress_pct,
            "session_count": len(today_sessions)
        },
        "streak": {
            "current": current_user.current_streak,
            "best": current_user.best_streak
        },
        "xp": current_user.xp,
        "level": current_user.level,
        "subject_time": subject_time,
        "priorities": priorities,
        "alerts": alerts,
        "recent_sessions": [s.to_dict() for s in recent_sessions],
        "tasks_today": [t.to_dict() for t in tasks_today]
    })
