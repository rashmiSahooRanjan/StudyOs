import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Question, QuestionAttempt, Mistake
from app.utils.helpers import require_auth
from app.services.revision import schedule_topic_revision

question_bp = Blueprint("questions", __name__, url_prefix="/api/questions")

@question_bp.route("", methods=["GET"])
@require_auth
def get_questions(current_user):
    exam_id = request.args.get("exam_id", type=int)
    subject_id = request.args.get("subject_id", type=int)
    topic_id = request.args.get("topic_id", type=int)
    year = request.args.get("year", type=int)
    difficulty = request.args.get("difficulty")

    query = Question.query
    if exam_id:
        query = query.filter_by(exam_id=exam_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if topic_id:
        query = query.filter_by(topic_id=topic_id)
    if year:
        query = query.filter_by(year=year)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)

    questions = query.all()
    return jsonify({"questions": [q.to_dict() for q in questions], "count": len(questions)})


@question_bp.route("", methods=["POST"])
@require_auth
def create_question(current_user):
    data = request.get_json() or {}
    text = data.get("question_text", "").strip()
    answer = data.get("answer", "").strip()
    subject_id = data.get("subject_id")

    if not text or not answer or not subject_id:
        return jsonify({"error": "question_text, answer, and subject_id are required"}), 400

    options = data.get("options", [])
    q = Question(
        exam_id=data.get("exam_id"),
        subject_id=subject_id,
        topic_id=data.get("topic_id"),
        question_text=text,
        options_json=json.dumps(options) if options else None,
        answer=answer,
        explanation=data.get("explanation", ""),
        year=data.get("year"),
        difficulty=data.get("difficulty", "Medium"),
        marks=float(data.get("marks", 2.0)),
        negative_marks=float(data.get("negative_marks", 0.66)),
        source=data.get("source", "PYQ")
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({"message": "Question added", "question": q.to_dict()}), 201


@question_bp.route("/<int:question_id>/attempt", methods=["POST"])
@require_auth
def attempt_question(current_user, question_id):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    data = request.get_json() or {}
    selected_answer = str(data.get("selected_answer", "")).strip()
    time_taken = int(data.get("time_taken_seconds", 60))

    is_correct = (selected_answer.lower() == question.answer.strip().lower())

    attempt = QuestionAttempt(
        question_id=question.id,
        user_id=current_user.id,
        selected_answer=selected_answer,
        correct=is_correct,
        time_taken_seconds=time_taken
    )
    db.session.add(attempt)

    # Award XP
    xp_earned = 15 if is_correct else 5
    current_user.xp += xp_earned

    # If incorrect, automatically add to Mistake Book (Section 21)
    mistake_created = False
    if not is_correct:
        existing_mistake = Mistake.query.filter_by(
            user_id=current_user.id,
            question_id=question.id
        ).first()

        if not existing_mistake:
            mistake = Mistake(
                user_id=current_user.id,
                question_id=question.id,
                subject_id=question.subject_id,
                topic_id=question.topic_id,
                user_answer=selected_answer,
                correct_answer=question.answer,
                reason=data.get("mistake_reason", "concept gap"),
                concept_note=f"Review fundamentals of {question.topic.name if question.topic else 'this topic'}.",
                reviewed=False,
                reattempted=False
            )
            db.session.add(mistake)
            mistake_created = True
        else:
            existing_mistake.user_answer = selected_answer
            existing_mistake.last_result = "failed_again"
            existing_mistake.reattempted = True

        # Schedule revision for incorrect question topic
        if question.topic_id:
            schedule_topic_revision(current_user.id, question.topic_id, question.id)

    db.session.commit()

    return jsonify({
        "correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.explanation,
        "xp_earned": xp_earned,
        "mistake_logged": mistake_created
    })
