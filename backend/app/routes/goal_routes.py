from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Goal, Task
from app.utils.helpers import require_auth

goal_bp = Blueprint("goals_tasks", __name__, url_prefix="/api")

# --- Goals ---
@goal_bp.route("/goals", methods=["GET"])
@require_auth
def get_goals(current_user):
    goals = Goal.query.filter_by(user_id=current_user.id).all()
    return jsonify({"goals": [g.to_dict() for g in goals]})


@goal_bp.route("/goals", methods=["POST"])
@require_auth
def create_goal(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    target_value = float(data.get("target_value", 10.0))
    if not title:
        return jsonify({"error": "Goal title is required"}), 400

    goal = Goal(
        user_id=current_user.id,
        type=data.get("type", "Daily"), # Daily, Weekly, Monthly, Exam, Course
        title=title,
        target_value=target_value,
        current_value=float(data.get("current_value", 0.0)),
        unit=data.get("unit", "hours"),
        period=data.get("period", "daily"),
        start_date=data.get("start_date", date.today().strftime("%Y-%m-%d")),
        end_date=data.get("end_date"),
        status=data.get("status", "active")
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({"message": "Goal created", "goal": goal.to_dict()}), 201


@goal_bp.route("/goals/<int:goal_id>", methods=["DELETE"])
@require_auth
def delete_goal(current_user, goal_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"})


# --- Tasks & Planner Blocks ---
@goal_bp.route("/tasks", methods=["GET"])
@require_auth
def get_tasks(current_user):
    date_str = request.args.get("date") # optional YYYY-MM-DD filter
    query = Task.query.filter_by(user_id=current_user.id)
    if date_str:
        query = query.filter_by(due_date=date_str)
    tasks = query.order_by(Task.due_date.asc(), Task.priority.desc()).all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]})


@goal_bp.route("/tasks", methods=["POST"])
@require_auth
def create_task(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Task title is required"}), 400

    task = Task(
        user_id=current_user.id,
        subject_id=data.get("subject_id"),
        title=title,
        due_date=data.get("due_date", date.today().strftime("%Y-%m-%d")),
        priority=data.get("priority", "medium"),
        planned_minutes=int(data.get("planned_minutes", 60)),
        scheduled_time=data.get("scheduled_time", "19:00 - 20:00"),
        status=data.get("status", "pending")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created", "task": task.to_dict()}), 201


@goal_bp.route("/tasks/<int:task_id>", methods=["PUT"])
@require_auth
def update_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json() or {}
    if "status" in data:
        task.status = data["status"]
        if task.status == "completed":
            task.actual_minutes = task.planned_minutes
    if "actual_minutes" in data:
        task.actual_minutes = int(data["actual_minutes"])
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "scheduled_time" in data:
        task.scheduled_time = data["scheduled_time"]

    db.session.commit()
    return jsonify({"message": "Task updated", "task": task.to_dict()})


@goal_bp.route("/tasks/rollover", methods=["POST"])
@require_auth
def rollover_tasks(current_user):
    """
    Smart rescheduling: move unfinished tasks from past dates to today.
    """
    today_str = date.today().strftime("%Y-%m-%d")
    overdue_tasks = Task.query.filter(
        Task.user_id == current_user.id,
        Task.status.in_(["pending", "in_progress"]),
        Task.due_date < today_str
    ).all()

    count = 0
    for t in overdue_tasks:
        t.due_date = today_str
        count += 1

    db.session.commit()
    return jsonify({"message": f"Successfully rescheduled {count} tasks to today", "rescheduled_count": count})


@goal_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@require_auth
def delete_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})
