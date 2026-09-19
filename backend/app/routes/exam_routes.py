from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Exam, Subject, Topic
from app.utils.helpers import require_auth

exam_bp = Blueprint("exams", __name__, url_prefix="/api/exams")

@exam_bp.route("", methods=["GET"])
@require_auth
def get_exams(current_user):
    exams = Exam.query.filter_by(user_id=current_user.id).all()
    return jsonify({"exams": [e.to_dict(include_subjects=True) for e in exams]})


@exam_bp.route("", methods=["POST"])
@require_auth
def create_exam(current_user):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    exam_date = data.get("exam_date", "").strip()

    if not name or not exam_date:
        return jsonify({"error": "Exam name and exam date are required"}), 400

    exam = Exam(
        user_id=current_user.id,
        name=name,
        exam_date=exam_date,
        target_score=float(data.get("target_score", 80.0)),
        target_rank=int(data.get("target_rank", 100)) if data.get("target_rank") else None,
        revision_strategy=data.get("revision_strategy", "spaced_repetition"),
        notes=data.get("notes", "")
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify({"message": "Exam created successfully", "exam": exam.to_dict()}), 201


@exam_bp.route("/<int:exam_id>", methods=["GET"])
@require_auth
def get_exam_details(current_user, exam_id):
    exam = Exam.query.filter_by(id=exam_id, user_id=current_user.id).first()
    if not exam:
        return jsonify({"error": "Exam not found"}), 404
    return jsonify({"exam": exam.to_dict(include_subjects=True)})


@exam_bp.route("/<int:exam_id>/syllabus", methods=["GET"])
@require_auth
def get_exam_syllabus(current_user, exam_id):
    exam = Exam.query.filter_by(id=exam_id, user_id=current_user.id).first()
    if not exam:
        return jsonify({"error": "Exam not found"}), 404

    syllabus = []
    for subject in exam.subjects:
        subj_data = subject.to_dict()
        root_topics = [t for t in subject.topics if t.parent_id is None]
        subj_data["topics"] = [t.to_dict(include_subtopics=True) for t in root_topics]
        syllabus.append(subj_data)

    return jsonify({
        "exam_id": exam.id,
        "exam_name": exam.name,
        "overall_progress": exam.calculate_syllabus_completion(),
        "days_remaining": exam.days_remaining(),
        "syllabus": syllabus
    })


@exam_bp.route("/<int:exam_id>", methods=["DELETE"])
@require_auth
def delete_exam(current_user, exam_id):
    exam = Exam.query.filter_by(id=exam_id, user_id=current_user.id).first()
    if not exam:
        return jsonify({"error": "Exam not found"}), 404
    db.session.delete(exam)
    db.session.commit()
    return jsonify({"message": "Exam deleted"})
