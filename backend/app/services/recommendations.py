from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import (
    Revision, Question, QuestionAttempt, Topic, Subject,
    Course, Exam, StudySession, MockAttempt, Mistake, Task
)

def generate_smart_recommendations(user_id):
    """
    Transparent Rule-Based Recommendation Engine (Zero External AI API).
    Implements Rules R1 to R8 specified in Appendix C and Section 25.
    Strictly scoped to the specific user's courses, exams, subjects, and study actions.
    No global or demo seed data is ever shown.
    """
    recommendations = []
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")

    # -------------------------------------------------------------
    # 0. Find all subjects belonging to this specific user
    # -------------------------------------------------------------
    user_courses = Course.query.filter_by(user_id=user_id).all()
    user_exams = Exam.query.filter_by(user_id=user_id).all()
    user_course_ids = [c.id for c in user_courses]
    user_exam_ids = [e.id for e in user_exams]

    user_subjects = Subject.query.filter(
        (Subject.user_id == user_id) |
        (Subject.course_id.in_(user_course_ids) if user_course_ids else False) |
        (Subject.exam_id.in_(user_exam_ids) if user_exam_ids else False)
    ).all()
    user_subject_ids = [s.id for s in user_subjects]

    # -------------------------------------------------------------
    # Rule R1: Overdue or Today's Due Revisions (User's own revisions)
    # If a revision is due today or overdue, place in Today's Priorities
    # -------------------------------------------------------------
    revisions_due = Revision.query.filter(
        Revision.user_id == user_id,
        Revision.status != "completed",
        Revision.due_date <= today_str
    ).order_by(Revision.due_date.asc()).limit(4).all()

    for rev in revisions_due:
        topic_name = rev.topic.name if rev.topic else "Important Topic"
        subject_name = rev.topic.subject.name if (rev.topic and rev.topic.subject) else "Subject"
        is_overdue = rev.due_date < today_str
        recommendations.append({
            "rule_id": "R1",
            "type": "revision",
            "priority": "urgent" if is_overdue else "high",
            "title": f"Spaced Revision: {topic_name}",
            "description": f"{'Overdue since ' + rev.due_date if is_overdue else 'Due today'}. Spaced interval: Day +{rev.interval_days}.",
            "subject": subject_name,
            "action_text": "Revise Now",
            "action_link": "/revision",
            "badge": "Overdue" if is_overdue else "Due Today"
        })

    # -------------------------------------------------------------
    # Rule R2: Low Topic Accuracy on User's Attempted Topics
    # If topic accuracy < 60% with at least 5 attempts by this user
    # -------------------------------------------------------------
    if user_subject_ids:
        user_topics = Topic.query.filter(Topic.subject_id.in_(user_subject_ids)).all()
        for topic in user_topics:
            questions = Question.query.filter_by(topic_id=topic.id).all()
            q_ids = [q.id for q in questions]
            if q_ids:
                attempts = QuestionAttempt.query.filter(
                    QuestionAttempt.user_id == user_id,
                    QuestionAttempt.question_id.in_(q_ids)
                ).all()
                if len(attempts) >= 5:
                    correct_count = sum(1 for a in attempts if a.correct)
                    accuracy = (correct_count / len(attempts)) * 100
                    if accuracy < 60:
                        recommendations.append({
                            "rule_id": "R2",
                            "type": "practice",
                            "priority": "high",
                            "title": f"Weak Topic Detected: {topic.name}",
                            "description": f"Accuracy is currently {accuracy:.1f}% over {len(attempts)} questions. Concept review recommended.",
                            "subject": topic.subject.name if topic.subject else "",
                            "action_text": "Practice Questions",
                            "action_link": "/questions",
                            "badge": f"{accuracy:.0f}% Acc"
                        })

    # -------------------------------------------------------------
    # Rule R3: Neglected Subjects (Previously studied by user, but not in 7+ days)
    # Only applies to subjects the user has actively studied previously.
    # Never shows dummy or unstarted subjects to new users.
    # -------------------------------------------------------------
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    for sub in user_subjects:
        last_session = StudySession.query.filter(
            StudySession.user_id == user_id,
            StudySession.subject_id == sub.id
        ).order_by(StudySession.start_time.desc()).first()

        # Only alert if the user has previously studied this subject and hasn't returned in 7+ days
        if last_session and last_session.start_time < seven_days_ago:
            days_inactive = (datetime.utcnow() - last_session.start_time).days
            recommendations.append({
                "rule_id": "R3",
                "type": "inactive",
                "priority": "medium",
                "title": f"Study Inactivity Alert: {sub.name}",
                "description": f"Has not been studied for {days_inactive} days. Review fundamentals to prevent forgetting.",
                "subject": sub.name,
                "action_text": "Study Subject",
                "action_link": "/timer",
                "badge": f"{days_inactive}d Inactive"
            })

    # -------------------------------------------------------------
    # Rule R4: Weak Mock Test Sections (< 70% in recent mock taken by user)
    # -------------------------------------------------------------
    latest_mock = MockAttempt.query.filter_by(user_id=user_id).order_by(MockAttempt.attempted_at.desc()).first()
    if latest_mock:
        breakdown = latest_mock.get_section_breakdown()
        for section, score in breakdown.items():
            if score < 70:
                recommendations.append({
                    "rule_id": "R4",
                    "type": "mock_gap",
                    "priority": "high",
                    "title": f"Mock Test Weak Spot: {section}",
                    "description": f"Scored {score}% in section '{section}' on {latest_mock.mock_test.title if latest_mock.mock_test else 'Mock Test'}.",
                    "subject": section,
                    "action_text": "Analyze Mistakes",
                    "action_link": "/mistakes",
                    "badge": f"{score}% Section Score"
                })

    # -------------------------------------------------------------
    # Rule R5: High-Priority Incomplete Topics Approaching User's Exam Date
    # -------------------------------------------------------------
    active_exams = Exam.query.filter_by(user_id=user_id, status="active").all()
    for exam in active_exams:
        days_left = exam.days_remaining()
        if days_left <= 60:
            for sub in exam.subjects:
                for top in sub.topics:
                    if top.priority == "high" and top.completion_pct < 70 and top.parent_id is None:
                        recommendations.append({
                            "rule_id": "R5",
                            "type": "exam_urgent",
                            "priority": "urgent",
                            "title": f"Exam Urgent: {top.name}",
                            "description": f"{exam.name} is in {days_left} days. High weight topic is only {top.completion_pct:.0f}% complete.",
                            "subject": sub.name,
                            "action_text": "Study Topic",
                            "action_link": "/syllabus",
                            "badge": f"{days_left}d to Exam"
                        })

    # -------------------------------------------------------------
    # Rule R7: Subject Time Imbalance Alert (User's own logged sessions)
    # -------------------------------------------------------------
    total_sessions = StudySession.query.filter_by(user_id=user_id).all()
    if len(total_sessions) >= 5:
        sub_time_map = {}
        total_minutes = 0
        for sess in total_sessions:
            if sess.subject_id:
                sub_time_map[sess.subject_id] = sub_time_map.get(sess.subject_id, 0) + sess.duration_minutes
                total_minutes += sess.duration_minutes

        if total_minutes > 120:
            for sub_id, minutes in sub_time_map.items():
                ratio = (minutes / total_minutes) * 100
                if ratio > 65 and len(sub_time_map) > 1:
                    sub_obj = db.session.get(Subject, sub_id)
                    recommendations.append({
                        "rule_id": "R7",
                        "type": "imbalance",
                        "priority": "low",
                        "title": f"Subject Bias Alert: {sub_obj.name if sub_obj else 'Subject'}",
                        "description": f"Takes up {ratio:.0f}% of total logged study time. Diversify to cover other syllabus areas.",
                        "subject": sub_obj.name if sub_obj else "",
                        "action_text": "Check Balance",
                        "action_link": "/analytics",
                        "badge": f"{ratio:.0f}% of Total"
                    })

    # -------------------------------------------------------------
    # Rule R8: Unresolved Repeated Mistakes in Mistake Book
    # -------------------------------------------------------------
    unresolved_mistakes = Mistake.query.filter(
        Mistake.user_id == user_id,
        Mistake.last_result == "failed_again"
    ).limit(3).all()

    for m in unresolved_mistakes:
        q_text = (m.question.question_text[:60] + "...") if m.question else "Question"
        recommendations.append({
            "rule_id": "R8",
            "type": "mistake",
            "priority": "urgent",
            "title": f"Repeat Mistake: {m.reason.title()}",
            "description": f"Failed reattempt on '{q_text}'. Concept note review required.",
            "subject": m.subject.name if m.subject else "Mistake Book",
            "action_text": "Review Concept Note",
            "action_link": "/mistakes",
            "badge": "Repeat Error"
        })

    # Sort recommendations: urgent first, then high, medium, low
    priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 99))

    return recommendations[:8]
