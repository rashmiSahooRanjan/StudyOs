from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import StudySession, Subject, Topic, Goal, User
from app.utils.helpers import require_auth
from app.services.revision import schedule_topic_revision

study_bp = Blueprint("study", __name__, url_prefix="/api/study-sessions")

@study_bp.route("", methods=["GET"])
@require_auth
def get_study_sessions(current_user):
    subject_id = request.args.get("subject_id", type=int)
    mode = request.args.get("mode")
    date_str = request.args.get("date") # YYYY-MM-DD
    limit = request.args.get("limit", default=50, type=int)

    query = StudySession.query.filter_by(user_id=current_user.id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if mode:
        query = query.filter_by(mode=mode)
    if date_str:
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(
                StudySession.start_time >= datetime.combine(d, datetime.min.time()),
                StudySession.start_time <= datetime.combine(d, datetime.max.time())
            )
        except Exception:
            pass

    sessions = query.order_by(StudySession.start_time.desc()).limit(limit).all()
    return jsonify({
        "sessions": [s.to_dict() for s in sessions],
        "total": len(sessions)
    })


@study_bp.route("", methods=["POST"])
@require_auth
def log_or_start_session(current_user):
    data = request.get_json() or {}
    subject_id = data.get("subject_id")
    topic_id = data.get("topic_id")
    course_id = data.get("course_id")
    exam_id = data.get("exam_id")
    duration_minutes = float(data.get("duration_minutes", 25.0))
    mode = data.get("mode", "Learning")
    focus_rating = int(data.get("focus_rating", 4))
    distraction_count = int(data.get("distraction_count", 0))
    distraction_notes = data.get("distraction_notes", "")
    notes = data.get("notes", "")

    start_time_str = data.get("start_time")
    if start_time_str:
        try:
            start_time = datetime.fromisoformat(start_time_str)
        except Exception:
            start_time = datetime.utcnow()
    else:
        start_time = datetime.utcnow()

    end_time = start_time + timedelta(minutes=duration_minutes)

    session = StudySession(
        user_id=current_user.id,
        course_id=course_id,
        exam_id=exam_id,
        subject_id=subject_id,
        topic_id=topic_id,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=duration_minutes,
        mode=mode,
        focus_rating=max(1, min(5, focus_rating)),
        distraction_count=max(0, distraction_count),
        distraction_notes=distraction_notes,
        notes=notes,
        is_active=False
    )
    db.session.add(session)

    # 1. Update Topic last studied date & trigger spaced revision if mode is Learning/Revision
    if topic_id:
        topic = db.session.get(Topic, topic_id)
        if topic:
            topic.last_studied_at = datetime.utcnow()
            # If studied for > 20 mins, check or schedule revision
            if duration_minutes >= 20:
                schedule_topic_revision(current_user.id, topic.id)

    # 2. Update Streak & XP
    today_str = date.today().strftime("%Y-%m-%d")
    yesterday_str = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    if current_user.last_study_date == yesterday_str:
        current_user.current_streak += 1
    elif current_user.last_study_date != today_str:
        current_user.current_streak = 1

    if current_user.current_streak > current_user.best_streak:
        current_user.best_streak = current_user.current_streak

    current_user.last_study_date = today_str

    # Award XP: 10 XP per 10 minutes studied
    earned_xp = int((duration_minutes / 10.0) * 10)
    current_user.xp += earned_xp
    current_user.level = max(1, current_user.xp // 250 + 1)

    # 3. Update active daily study goals
    daily_goals = Goal.query.filter_by(user_id=current_user.id, type="Daily", unit="hours").all()
    for g in daily_goals:
        g.current_value = round(g.current_value + (duration_minutes / 60.0), 2)

    db.session.commit()

    return jsonify({
        "message": "Study session logged successfully",
        "session": session.to_dict(),
        "earned_xp": earned_xp,
        "new_streak": current_user.current_streak
    }), 201


@study_bp.route("/<int:session_id>", methods=["DELETE"])
@require_auth
def delete_study_session(current_user, session_id):
    session = StudySession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted successfully"})
