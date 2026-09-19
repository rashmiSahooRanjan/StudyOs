from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Revision, Flashcard
from app.utils.helpers import require_auth
from app.services.revision import complete_revision_step, get_user_revision_summary

revision_bp = Blueprint("revisions", __name__, url_prefix="/api")

@revision_bp.route("/revisions/today", methods=["GET"])
@require_auth
def get_today_revisions(current_user):
    summary = get_user_revision_summary(current_user.id)
    return jsonify(summary)


@revision_bp.route("/revisions/<int:revision_id>/complete", methods=["POST"])
@require_auth
def complete_revision(current_user, revision_id):
    data = request.get_json() or {}
    quality = data.get("quality", "good") # easy, good, hard, forgot

    rev = complete_revision_step(revision_id, current_user.id, quality=quality)
    if not rev:
        return jsonify({"error": "Revision not found"}), 404

    # Award XP
    current_user.xp += 20
    db.session.commit()

    return jsonify({
        "message": f"Revision updated with recall quality '{quality}'",
        "revision": rev.to_dict(),
        "earned_xp": 20
    })


# --- Flashcards ---
@revision_bp.route("/flashcards", methods=["GET"])
@require_auth
def get_flashcards(current_user):
    subject_id = request.args.get("subject_id", type=int)
    topic_id = request.args.get("topic_id", type=int)

    query = Flashcard.query.filter_by(user_id=current_user.id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if topic_id:
        query = query.filter_by(topic_id=topic_id)

    cards = query.all()
    return jsonify({"flashcards": [c.to_dict() for c in cards]})


@revision_bp.route("/flashcards", methods=["POST"])
@require_auth
def create_flashcard(current_user):
    data = request.get_json() or {}
    front = data.get("front", "").strip()
    back = data.get("back", "").strip()
    subject_id = data.get("subject_id")

    if not front or not back or not subject_id:
        return jsonify({"error": "front, back, and subject_id are required"}), 400

    card = Flashcard(
        user_id=current_user.id,
        subject_id=subject_id,
        topic_id=data.get("topic_id"),
        front=front,
        back=back,
        difficulty=data.get("difficulty", "medium"),
        next_review_date=(date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
    )
    db.session.add(card)
    db.session.commit()
    return jsonify({"message": "Flashcard created", "flashcard": card.to_dict()}), 201


@revision_bp.route("/flashcards/<int:card_id>/review", methods=["POST"])
@require_auth
def review_flashcard(current_user, card_id):
    card = Flashcard.query.filter_by(id=card_id, user_id=current_user.id).first()
    if not card:
        return jsonify({"error": "Flashcard not found"}), 404

    data = request.get_json() or {}
    difficulty = data.get("difficulty", "medium") # easy, medium, hard

    card.reviews_count += 1
    card.last_reviewed_at = datetime.utcnow()

    # Dynamic interval
    if difficulty == "easy":
        card.interval_days = max(2, int(card.interval_days * 2.0))
    elif difficulty == "hard":
        card.interval_days = 1
    else:
        card.interval_days = max(2, int(card.interval_days * 1.5))

    card.next_review_date = (date.today() + timedelta(days=card.interval_days)).strftime("%Y-%m-%d")
    current_user.xp += 10
    db.session.commit()

    return jsonify({"message": "Flashcard reviewed", "flashcard": card.to_dict(), "earned_xp": 10})
