from datetime import datetime, date, timedelta
from collections import defaultdict
from app.extensions import db
from app.models import (
    StudySession, Subject, Topic, QuestionAttempt, ReadingSession, ReadingItem, Goal, Task
)

def compute_study_dna(user_id):
    """
    Computes user's personal Study DNA metrics as specified in Section 26.
    Descriptive statistics derived purely from user's logged activity.
    """
    sessions = StudySession.query.filter_by(user_id=user_id).all()
    if not sessions:
        return {
            "avg_daily_study_minutes": 0,
            "avg_daily_study_display": "0h 00m",
            "avg_session_minutes": 0,
            "avg_session_display": "0m",
            "peak_productive_period": "8:00 PM - 10:00 PM",
            "highest_focus_subject": "Not enough data",
            "least_studied_subject": "Not enough data",
            "avg_focus_score": 4.0,
            "weekly_consistency_pct": 0,
            "avg_reading_pages_day": 0,
            "total_study_hours": 0
        }

    # 1. Total minutes & unique days
    total_minutes = sum(s.duration_minutes for s in sessions)
    dates_with_study = set(s.start_time.strftime("%Y-%m-%d") for s in sessions if s.start_time)
    num_days = max(1, len(dates_with_study))
    
    avg_daily_mins = total_minutes / num_days
    avg_session_mins = total_minutes / len(sessions)

    # 2. Most productive hour window (e.g. 8 PM - 10 PM)
    hour_counts = defaultdict(float)
    for s in sessions:
        if s.start_time:
            hr = s.start_time.hour
            hour_counts[hr] += s.duration_minutes

    if hour_counts:
        peak_hour = max(hour_counts, key=hour_counts.get)
        peak_period = f"{peak_hour:02d}:00 - {(peak_hour + 2) % 24:02d}:00"
    else:
        peak_period = "20:00 - 22:00"

    # 3. Subject focus and duration aggregations
    subject_focus_map = defaultdict(list)
    subject_time_map = defaultdict(float)

    for s in sessions:
        if s.subject:
            subject_focus_map[s.subject.name].append(s.focus_rating)
            subject_time_map[s.subject.name] += s.duration_minutes

    highest_focus_subj = "None"
    highest_focus_val = 0
    for subj_name, ratings in subject_focus_map.items():
        if ratings:
            avg_r = sum(ratings) / len(ratings)
            if avg_r > highest_focus_val:
                highest_focus_val = avg_r
                highest_focus_subj = f"{subj_name} ({avg_r:.1f}/5)"

    all_subjects = Subject.query.all()
    least_studied_subj = "None"
    least_time = float("inf")
    for subj in all_subjects:
        logged_t = subject_time_map.get(subj.name, 0)
        if logged_t < least_time:
            least_time = logged_t
            least_studied_subj = subj.name

    # 4. Focus score average
    ratings_all = [s.focus_rating for s in sessions if s.focus_rating]
    avg_focus = round(sum(ratings_all) / len(ratings_all), 1) if ratings_all else 4.0

    # 5. Weekly consistency (% of days in past 28 days with >= 30m study)
    past_28_days = [ (date.today() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(28) ]
    active_days_count = sum(1 for d in past_28_days if d in dates_with_study)
    weekly_consistency = round((active_days_count / 28.0) * 100, 1)

    # 6. Reading stats
    reading_sessions = ReadingSession.query.join(ReadingItem).filter(ReadingItem.user_id == user_id).all()
    total_pages = sum(r.pages_read for r in reading_sessions)
    reading_days = max(1, len(set(r.start_time.strftime("%Y-%m-%d") for r in reading_sessions if r.start_time)))
    avg_reading = round(total_pages / reading_days, 1) if reading_sessions else 0

    return {
        "avg_daily_study_minutes": round(avg_daily_mins, 1),
        "avg_daily_study_display": f"{int(avg_daily_mins // 60):02d}h {int(avg_daily_mins % 60):02d}m",
        "avg_session_minutes": round(avg_session_mins, 1),
        "avg_session_display": f"{int(avg_session_mins)} min",
        "peak_productive_period": peak_period,
        "highest_focus_subject": highest_focus_subj,
        "least_studied_subject": least_studied_subj,
        "avg_focus_score": avg_focus,
        "weekly_consistency_pct": weekly_consistency,
        "avg_reading_pages_day": avg_reading,
        "total_study_hours": round(total_minutes / 60.0, 1)
    }


def compute_heatmap_data(user_id, days=90):
    """
    Generates activity data for GitHub-style study heatmap.
    """
    start_date = date.today() - timedelta(days=days)
    sessions = StudySession.query.filter(
        StudySession.user_id == user_id,
        StudySession.start_time >= start_date
    ).all()

    date_minutes = defaultdict(float)
    date_sessions = defaultdict(int)

    for s in sessions:
        if s.start_time:
            d_str = s.start_time.strftime("%Y-%m-%d")
            date_minutes[d_str] += s.duration_minutes
            date_sessions[d_str] += 1

    result = []
    for i in range(days + 1):
        cur_date = start_date + timedelta(days=i)
        cur_str = cur_date.strftime("%Y-%m-%d")
        mins = date_minutes.get(cur_str, 0)
        sess_count = date_sessions.get(cur_str, 0)
        
        # Intensity level: 0 to 4
        if mins == 0:
            level = 0
        elif mins < 60:
            level = 1
        elif mins < 180:
            level = 2
        elif mins < 300:
            level = 3
        else:
            level = 4

        result.append({
            "date": cur_str,
            "minutes": round(mins, 1),
            "sessions": sess_count,
            "level": level
        })

    return result


def compute_subject_balance(user_id):
    """
    Calculates subject distribution percentages for charts & radar plots.
    """
    sessions = StudySession.query.filter_by(user_id=user_id).all()
    subj_time = defaultdict(float)
    subj_colors = {}
    total_time = 0

    for s in sessions:
        if s.subject:
            subj_time[s.subject.name] += s.duration_minutes
            subj_colors[s.subject.name] = s.subject.color
            total_time += s.duration_minutes

    if total_time == 0:
        return []

    breakdown = []
    for name, mins in subj_time.items():
        breakdown.append({
            "subject": name,
            "minutes": round(mins, 1),
            "hours": round(mins / 60.0, 1),
            "percentage": round((mins / total_time) * 100, 1),
            "color": subj_colors.get(name, "#6366F1")
        })

    breakdown.sort(key=lambda x: x["minutes"], reverse=True)
    return breakdown
