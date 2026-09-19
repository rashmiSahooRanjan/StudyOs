from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Course, Subject, Topic
from app.utils.helpers import require_auth
from app.services.revision import schedule_topic_revision

course_bp = Blueprint("courses", __name__, url_prefix="/api")

# --- Courses ---
@course_bp.route("/courses", methods=["GET"])
@require_auth
def get_courses(current_user):
    courses = Course.query.filter_by(user_id=current_user.id).all()
    return jsonify({"courses": [c.to_dict(include_subjects=True) for c in courses]})


@course_bp.route("/courses", methods=["POST"])
@require_auth
def create_course(current_user):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Course name is required"}), 400

    course = Course(
        user_id=current_user.id,
        name=name,
        description=data.get("description", ""),
        start_date=data.get("start_date"),
        target_date=data.get("target_date"),
        status=data.get("status", "active")
    )
    db.session.add(course)
    db.session.commit()
    return jsonify({"message": "Course created", "course": course.to_dict()}), 201


@course_bp.route("/courses/<int:course_id>", methods=["GET"])
@require_auth
def get_course(current_user, course_id):
    course = Course.query.filter_by(id=course_id, user_id=current_user.id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404
    return jsonify({"course": course.to_dict(include_subjects=True)})


@course_bp.route("/courses/<int:course_id>", methods=["DELETE"])
@require_auth
def delete_course(current_user, course_id):
    course = Course.query.filter_by(id=course_id, user_id=current_user.id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted"})


# --- Subjects ---
@course_bp.route("/subjects", methods=["GET"])
@require_auth
def get_subjects(current_user):
    course_id = request.args.get("course_id", type=int)
    exam_id = request.args.get("exam_id", type=int)

    user_course_ids = [c.id for c in current_user.courses]
    user_exam_ids = [e.id for e in current_user.exams]

    query = Subject.query.filter(
        (Subject.user_id == current_user.id) |
        (Subject.course_id.in_(user_course_ids) if user_course_ids else False) |
        (Subject.exam_id.in_(user_exam_ids) if user_exam_ids else False)
    )

    if course_id:
        query = query.filter_by(course_id=course_id)
    if exam_id:
        query = query.filter_by(exam_id=exam_id)

    subjects = query.all()
    return jsonify({"subjects": [s.to_dict(include_topics=True) for s in subjects]})


@course_bp.route("/subjects", methods=["POST"])
@require_auth
def create_subject(current_user):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Subject name is required"}), 400

    subject = Subject(
        user_id=current_user.id,
        course_id=data.get("course_id"),
        exam_id=data.get("exam_id"),
        name=name,
        code=data.get("code"),
        color=data.get("color", "#6366F1"),
        icon=data.get("icon", "BookOpen"),
        priority=data.get("priority", "medium"),
        weightage=float(data.get("weightage", 1.0))
    )
    db.session.add(subject)
    db.session.commit()
    return jsonify({"message": "Subject created", "subject": subject.to_dict()}), 201


@course_bp.route("/subjects/<int:subject_id>", methods=["DELETE"])
@require_auth
def delete_subject(current_user, subject_id):
    subject = db.session.get(Subject, subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404
    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": "Subject deleted successfully"})


# --- Topics & Hierarchical Syllabus ---
@course_bp.route("/topics", methods=["POST"])
@require_auth
def create_topic(current_user):
    data = request.get_json() or {}
    subject_id = data.get("subject_id")
    name = data.get("name", "").strip()
    if not subject_id or not name:
        return jsonify({"error": "Subject ID and topic name are required"}), 400

    topic = Topic(
        subject_id=subject_id,
        parent_id=data.get("parent_id"),
        name=name,
        status=data.get("status", "not_started"),
        completion_pct=float(data.get("completion_pct", 0.0)),
        priority=data.get("priority", "medium"),
        estimated_hours=float(data.get("estimated_hours", 3.0)),
        weightage=float(data.get("weightage", 1.0))
    )
    db.session.add(topic)
    db.session.commit()
    return jsonify({"message": "Topic created", "topic": topic.to_dict()}), 201


@course_bp.route("/topics/<int:topic_id>/status", methods=["PUT"])
@require_auth
def update_topic_status(current_user, topic_id):
    topic = db.session.get(Topic, topic_id)
    if not topic:
        return jsonify({"error": "Topic not found"}), 404

    data = request.get_json() or {}
    if "status" in data:
        topic.status = data["status"]
    if "completion_pct" in data:
        topic.completion_pct = max(0.0, min(100.0, float(data["completion_pct"])))
        if topic.completion_pct == 100.0:
            topic.status = "completed"
            # Trigger spaced revision schedule for mastered/completed topic
            schedule_topic_revision(current_user.id, topic.id)
        elif topic.completion_pct > 0:
            topic.status = "in_progress"

    db.session.commit()
    return jsonify({"message": "Topic updated", "topic": topic.to_dict(include_subtopics=True)})
