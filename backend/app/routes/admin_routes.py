from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User, StudySession, QuestionAttempt, MockAttempt, Course, Exam
from app.utils.helpers import admin_required
from app.config import Config

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_all_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    user_list = []
    for u in users:
        d = u.to_dict()
        d["courses_count"] = len(u.courses)
        d["exams_count"] = len(u.exams)
        d["mistakes_count"] = len(u.mistakes)
        user_list.append(d)

    return jsonify({"users": user_list, "total_count": len(user_list)})


@admin_bp.route("/system-stats", methods=["GET"])
@admin_required
def get_system_stats(current_user):
    total_users = User.query.count()
    total_sessions = StudySession.query.count()
    all_sessions = StudySession.query.all()
    total_study_mins = sum(s.duration_minutes for s in all_sessions)
    total_attempts = QuestionAttempt.query.count()
    total_mocks = MockAttempt.query.count()

    # Database Info
    db_uri = Config.SQLALCHEMY_DATABASE_URI
    is_postgres = "postgresql" in db_uri or "postgres" in db_uri
    db_type = "PostgreSQL (Online/Cloud Ready)" if is_postgres else "SQLite WAL Mode (Local-First)"

    return jsonify({
        "stats": {
            "total_users": total_users,
            "total_study_hours": round(total_study_mins / 60.0, 1),
            "total_study_sessions": total_sessions,
            "total_question_attempts": total_attempts,
            "total_mock_attempts": total_mocks,
            "database_type": db_type,
            "database_status": "Online & Healthy"
        }
    })


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(current_user, user_id):
    if user_id == current_user.id:
        return jsonify({"error": "Cannot delete currently logged-in administrator account"}), 400

    target = User.query.get(user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    if target.username == "admin":
        return jsonify({"error": "Cannot delete master admin account"}), 400

    db.session.delete(target)
    db.session.commit()
    return jsonify({"message": f"User {target.name} ({target.email}) deleted successfully"})


@admin_bp.route("/users/<int:user_id>/toggle-admin", methods=["PUT"])
@admin_required
def toggle_admin(current_user, user_id):
    target = User.query.get(user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    if target.username == "admin":
        return jsonify({"error": "Cannot alter master admin privileges"}), 400

    target.is_admin = not target.is_admin
    db.session.commit()
    return jsonify({
        "message": f"User {target.name} admin status set to {target.is_admin}",
        "is_admin": target.is_admin
    })


@admin_bp.route("/users/<int:user_id>/reset-password", methods=["PUT"])
@admin_required
def admin_reset_password(current_user, user_id):
    target = User.query.get(user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    new_password = data.get("password", "studyos123")
    target.set_password(new_password)
    db.session.commit()

    return jsonify({"message": f"Password for {target.name} has been reset to: {new_password}"})
