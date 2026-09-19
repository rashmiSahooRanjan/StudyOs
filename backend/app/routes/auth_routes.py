from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User, Course, Subject, Topic
from app.utils.helpers import generate_token, require_auth

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    identifier = data.get("email", "").strip().lower()
    username = data.get("username", "").strip().lower() or identifier.split('@')[0]
    password = data.get("password", "")
    target_hours = float(data.get("target_daily_hours", 6.0))

    if not name or not identifier or not password:
        return jsonify({"error": "Name, email/username, and password are required"}), 400

    # Ensure email format if not provided
    email = identifier if "@" in identifier else f"{identifier}@studyos.local"

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({"error": "An account with this email or username already exists"}), 409

    # New registered user starts completely clean (0 hours, 0 streak, 0 XP, not admin)
    user = User(
        name=name,
        username=username,
        email=email,
        is_admin=False,
        target_daily_hours=target_hours,
        current_streak=0,
        best_streak=0,
        xp=0,
        level=1,
        last_study_date=None
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)
    return jsonify({
        "message": "Account created successfully",
        "token": token,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = str(data.get("email", "") or data.get("username", "") or data.get("identifier", "")).strip().lower()
    password = str(data.get("password", ""))

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password are required"}), 400

    # Support finding by email OR username (e.g. "admin")
    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    if not user:
        # Also check with @studyos.local
        user = User.query.filter_by(email=f"{identifier}@studyos.local").first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username/email or password"}), 401

    token = generate_token(user.id)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()
    })


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me(current_user):
    return jsonify({
        "user": current_user.to_dict()
    })


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile(current_user):
    data = request.get_json() or {}
    if "name" in data and data["name"].strip():
        current_user.name = data["name"].strip()
    if "target_daily_hours" in data:
        current_user.target_daily_hours = float(data["target_daily_hours"])
    db.session.commit()
    return jsonify({
        "message": "Profile updated",
        "user": current_user.to_dict()
    })


@auth_bp.route("/clone-starter-template", methods=["POST"])
@require_auth
def clone_starter_template(current_user):
    """
    Optional helper for new users who want starter subjects (OS, DBMS) without typing them manually.
    """
    course = Course(
        user_id=current_user.id,
        name="Competitive Exam & Degree Prep",
        description="Core foundational subjects and exam preparation",
        status="active"
    )
    db.session.add(course)
    db.session.flush()

    sub_os = Subject(user_id=current_user.id, course_id=course.id, name="Operating Systems", code="CS-OS", color="#3B82F6", priority="high")
    sub_db = Subject(user_id=current_user.id, course_id=course.id, name="Database Management", code="CS-DBMS", color="#10B981", priority="high")
    db.session.add_all([sub_os, sub_db])
    db.session.flush()

    t1 = Topic(subject_id=sub_os.id, name="Processes & State Transitions", status="not_started", completion_pct=0.0)
    t2 = Topic(subject_id=sub_os.id, name="CPU Scheduling & Deadlocks", status="not_started", completion_pct=0.0)
    t3 = Topic(subject_id=sub_db.id, name="Relational Model & Normalization", status="not_started", completion_pct=0.0)
    db.session.add_all([t1, t2, t3])

    db.session.commit()
    return jsonify({"message": "Starter subjects added successfully!"})
