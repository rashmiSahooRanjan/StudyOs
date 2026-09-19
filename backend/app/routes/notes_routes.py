from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Note
from app.utils.helpers import require_auth

notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")

@notes_bp.route("", methods=["GET"])
@require_auth
def get_notes(current_user):
    subject_id = request.args.get("subject_id", type=int)
    topic_id = request.args.get("topic_id", type=int)
    query_str = request.args.get("q")

    query = Note.query.filter_by(user_id=current_user.id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if topic_id:
        query = query.filter_by(topic_id=topic_id)
    if query_str:
        query = query.filter(Note.title.ilike(f"%{query_str}%") | Note.content.ilike(f"%{query_str}%"))

    notes = query.order_by(Note.pinned.desc(), Note.updated_at.desc()).all()
    return jsonify({"notes": [n.to_dict() for n in notes]})


@notes_bp.route("", methods=["POST"])
@require_auth
def create_note(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Note title is required"}), 400

    tags = data.get("tags")
    if isinstance(tags, list):
        tags = ",".join(tags)

    note = Note(
        user_id=current_user.id,
        subject_id=data.get("subject_id"),
        topic_id=data.get("topic_id"),
        title=title,
        content=data.get("content", ""),
        resource_type=data.get("resource_type", "Note"),
        url=data.get("url"),
        tags=tags,
        pinned=bool(data.get("pinned", False))
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({"message": "Note created", "note": note.to_dict()}), 201


@notes_bp.route("/<int:note_id>", methods=["PUT"])
@require_auth
def update_note(current_user, note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404

    data = request.get_json() or {}
    if "title" in data:
        note.title = data["title"].strip()
    if "content" in data:
        note.content = data["content"]
    if "resource_type" in data:
        note.resource_type = data["resource_type"]
    if "url" in data:
        note.url = data["url"]
    if "tags" in data:
        tags = data["tags"]
        note.tags = ",".join(tags) if isinstance(tags, list) else tags
    if "pinned" in data:
        note.pinned = bool(data["pinned"])

    db.session.commit()
    return jsonify({"message": "Note updated", "note": note.to_dict()})


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@require_auth
def delete_note(current_user, note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note deleted"})
