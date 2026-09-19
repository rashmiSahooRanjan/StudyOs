from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify, Response
from collections import defaultdict
from app.extensions import db
from app.models import StudySession, Subject, Achievement, DailyReflection, User
from app.utils.helpers import require_auth
from app.services.analytics import compute_study_dna, compute_heatmap_data, compute_subject_balance
from app.services.reports import export_full_backup_json, export_study_sessions_csv

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api")

@analytics_bp.route("/analytics/study-dna", methods=["GET"])
@require_auth
def get_study_dna(current_user):
    dna = compute_study_dna(current_user.id)
    return jsonify({"study_dna": dna})


@analytics_bp.route("/analytics/heatmap", methods=["GET"])
@require_auth
def get_heatmap(current_user):
    days = request.args.get("days", default=90, type=int)
    data = compute_heatmap_data(current_user.id, days=days)
    return jsonify({"heatmap": data})


@analytics_bp.route("/analytics/subjects", methods=["GET"])
@require_auth
def get_subject_balance(current_user):
    balance = compute_subject_balance(current_user.id)
    return jsonify({"subject_balance": balance})


@analytics_bp.route("/analytics/daily", methods=["GET"])
@require_auth
def get_daily_trend(current_user):
    # Last 14 days daily study minutes
    days = 14
    start_date = date.today() - timedelta(days=days - 1)
    sessions = StudySession.query.filter(
        StudySession.user_id == current_user.id,
        StudySession.start_time >= datetime.combine(start_date, datetime.min.time())
    ).all()

    day_map = defaultdict(float)
    day_focus = defaultdict(list)
    for s in sessions:
        if s.start_time:
            d_str = s.start_time.strftime("%Y-%m-%d")
            day_map[d_str] += s.duration_minutes
            day_focus[d_str].append(s.focus_rating)

    result = []
    for i in range(days):
        cur = start_date + timedelta(days=i)
        cur_str = cur.strftime("%Y-%m-%d")
        mins = day_map.get(cur_str, 0)
        ratings = day_focus.get(cur_str, [])
        avg_f = round(sum(ratings) / len(ratings), 1) if ratings else 0

        result.append({
            "date": cur.strftime("%b %d"),
            "full_date": cur_str,
            "minutes": round(mins, 1),
            "hours": round(mins / 60.0, 2),
            "avg_focus": avg_f
        })

    return jsonify({"daily_trend": result})


# --- Export & Backup ---
@analytics_bp.route("/export/backup", methods=["GET"])
@require_auth
def export_backup(current_user):
    backup = export_full_backup_json(current_user.id)
    return jsonify(backup)


@analytics_bp.route("/export/sessions-csv", methods=["GET"])
@require_auth
def export_sessions_csv(current_user):
    csv_data = export_study_sessions_csv(current_user.id)
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=studyos_sessions.csv"}
    )


# --- Achievements ---
@analytics_bp.route("/achievements", methods=["GET"])
@require_auth
def get_achievements(current_user):
    # Auto unlock milestones if conditions met
    existing = {a.badge_key for a in current_user.achievements}

    total_sessions = len(current_user.study_sessions)
    if total_sessions >= 1 and "first_session" not in existing:
        db.session.add(Achievement(
            user_id=current_user.id,
            badge_key="first_session",
            title="First Step",
            description="Completed your very first focus study session!",
            icon="Zap",
            category="Milestone"
        ))

    if current_user.current_streak >= 3 and "streak_3" not in existing:
        db.session.add(Achievement(
            user_id=current_user.id,
            badge_key="streak_3",
            title="Consistency Spark",
            description="Maintained a 3-day consecutive study streak!",
            icon="Flame",
            category="Streak"
        ))

    if current_user.current_streak >= 7 and "streak_7" not in existing:
        db.session.add(Achievement(
            user_id=current_user.id,
            badge_key="streak_7",
            title="Iron Will",
            description="Achieved a 7-day study streak!",
            icon="ShieldAlert",
            category="Streak"
        ))

    total_hours = sum(s.duration_minutes for s in current_user.study_sessions) / 60.0
    if total_hours >= 10 and "study_10h" not in existing:
        db.session.add(Achievement(
            user_id=current_user.id,
            badge_key="study_10h",
            title="Deep Diver",
            description="Logged more than 10 hours of focused study!",
            icon="Clock",
            category="Hours"
        ))

    db.session.commit()

    all_badges = Achievement.query.filter_by(user_id=current_user.id).all()
    return jsonify({"achievements": [a.to_dict() for a in all_badges]})
