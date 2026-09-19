from datetime import datetime
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import ReadingItem, ReadingSession
from app.utils.helpers import require_auth

reading_bp = Blueprint("reading", __name__, url_prefix="/api/reading")

@reading_bp.route("", methods=["GET"])
@require_auth
def get_reading_items(current_user):
    items = ReadingItem.query.filter_by(user_id=current_user.id).order_by(ReadingItem.created_at.desc()).all()
    
    # Calculate overall reading statistics
    total_pages_read = sum(item.current_page for item in items)
    completed_items = sum(1 for item in items if item.status == "completed")
    
    return jsonify({
        "items": [i.to_dict() for i in items],
        "stats": {
            "total_books_tracked": len(items),
            "completed_books": completed_items,
            "total_pages_read": total_pages_read
        }
    })


@reading_bp.route("", methods=["POST"])
@require_auth
def add_reading_item(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    item = ReadingItem(
        user_id=current_user.id,
        title=title,
        type=data.get("type", "Book"),
        author=data.get("author", ""),
        total_pages=int(data.get("total_pages", 100)),
        current_page=int(data.get("current_page", 0)),
        status=data.get("status", "reading"),
        cover_color=data.get("cover_color", "#3B82F6")
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Reading item added", "item": item.to_dict()}), 201


@reading_bp.route("/<int:item_id>/log-session", methods=["POST"])
@require_auth
def log_reading_session(current_user, item_id):
    item = ReadingItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({"error": "Reading item not found"}), 404

    data = request.get_json() or {}
    pages_read = int(data.get("pages_read", 10))
    duration_minutes = float(data.get("duration_minutes", 20.0))

    start_p = item.current_page
    end_p = min(item.total_pages, start_p + pages_read)
    item.current_page = end_p
    item.last_read_at = datetime.utcnow()

    if item.current_page >= item.total_pages:
        item.status = "completed"

    session = ReadingSession(
        reading_item_id=item.id,
        start_time=datetime.utcnow(),
        duration_minutes=duration_minutes,
        pages_read=pages_read,
        start_page=start_p,
        end_page=end_p
    )
    db.session.add(session)

    # Award XP for reading
    earned_xp = pages_read * 2
    current_user.xp += earned_xp

    db.session.commit()

    return jsonify({
        "message": "Reading session logged",
        "item": item.to_dict(),
        "earned_xp": earned_xp
    })


@reading_bp.route("/<int:item_id>", methods=["DELETE"])
@require_auth
def delete_reading_item(current_user, item_id):
    item = ReadingItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({"error": "Item not found"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Reading item removed"})
