from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Mistake, Question
from app.utils.helpers import require_auth
from app.services.revision import schedule_topic_revision

mistake_bp = Blueprint("mistakes", __name__, url_prefix="/api/mistakes")

@mistake_bp.route("", methods=["GET"])
@require_auth
def get_mistakes(current_user):
    reason = request.args.get("reason")
    subject_id = request.args.get("subject_id", type=int)
    reviewed = request.args.get("reviewed")

    query = Mistake.query.filter_by(user_id=current_user.id)
    if reason:
        query = query.filter_by(reason=reason)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if reviewed is not None:
        query = query.filter_by(reviewed=(reviewed.lower() == "true"))

    mistakes = query.order_by(Mistake.created_at.desc()).all()

    # Breakdown by reason
    reason_counts = {}
    for m in mistakes:
        r = m.reason or "other"
        reason_counts[r] = reason_counts.get(r, 0) + 1

    return jsonify({
        "mistakes": [m.to_dict() for m in mistakes],
        "total": len(mistakes),
        "reason_breakdown": reason_counts
    })


@mistake_bp.route("", methods=["POST"])
@require_auth
def create_mistake(current_user):
    data = request.get_json() or {}
    question_id = data.get("question_id")
    if not question_id:
        return jsonify({"error": "question_id is required"}), 400

    q = db.session.get(Question, question_id)
    mistake = Mistake(
        user_id=current_user.id,
        question_id=question_id,
        subject_id=q.subject_id if q else data.get("subject_id"),
        topic_id=q.topic_id if q else data.get("topic_id"),
        user_answer=data.get("user_answer", ""),
        correct_answer=q.answer if q else data.get("correct_answer", ""),
        reason=data.get("reason", "concept gap"),
        concept_note=data.get("concept_note", "")
    )
    db.session.add(mistake)
    db.session.commit()
    return jsonify({"message": "Mistake logged", "mistake": mistake.to_dict()}), 201


@mistake_bp.route("/<int:mistake_id>", methods=["PUT"])
@require_auth
def update_mistake(current_user, mistake_id):
    mistake = Mistake.query.filter_by(id=mistake_id, user_id=current_user.id).first()
    if not mistake:
        return jsonify({"error": "Mistake record not found"}), 404

    data = request.get_json() or {}
    if "reason" in data:
        mistake.reason = data["reason"]
    if "concept_note" in data:
        mistake.concept_note = data["concept_note"]
    if "reviewed" in data:
        mistake.reviewed = bool(data["reviewed"])

    db.session.commit()
    return jsonify({"message": "Mistake updated", "mistake": mistake.to_dict()})


@mistake_bp.route("/<int:mistake_id>/reattempt", methods=["POST"])
@require_auth
def reattempt_mistake(current_user, mistake_id):
    mistake = Mistake.query.filter_by(id=mistake_id, user_id=current_user.id).first()
    if not mistake:
        return jsonify({"error": "Mistake not found"}), 404

    data = request.get_json() or {}
    reattempt_answer = str(data.get("answer", "")).strip()

    correct_ans = mistake.correct_answer or (mistake.question.answer if mistake.question else "")
    is_correct = (reattempt_answer.lower() == correct_ans.strip().lower())

    mistake.reattempted = True
    mistake.user_answer = reattempt_answer
    mistake.last_result = "corrected" if is_correct else "failed_again"
    if is_correct:
        mistake.reviewed = True
        current_user.xp += 25
    else:
        # Rule R8: If mistake reattempted incorrectly, trigger priority review
        if mistake.topic_id:
            schedule_topic_revision(current_user.id, mistake.topic_id)

    db.session.commit()

    return jsonify({
        "is_correct": is_correct,
        "correct_answer": correct_ans,
        "explanation": mistake.question.explanation if mistake.question else None,
        "last_result": mistake.last_result,
        "earned_xp": 25 if is_correct else 0
    })


@mistake_bp.route("/<int:mistake_id>", methods=["DELETE"])
@require_auth
def delete_mistake(current_user, mistake_id):
    mistake = Mistake.query.filter_by(id=mistake_id, user_id=current_user.id).first()
    if not mistake:
        return jsonify({"error": "Mistake not found"}), 404
    db.session.delete(mistake)
    db.session.commit()
    return jsonify({"message": "Mistake deleted"})
