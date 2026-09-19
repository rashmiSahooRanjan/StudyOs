import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "studyos-secure-secret-key-2026-production-secure")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "studyos-jwt-secret-key-2026-production-ultra-secure-token")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # SQLite Database URI
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'studyos.db')}"
    )
    if SQLALCHEMY_DATABASE_URI.startswith("sqlite:///"):
        _db_path = SQLALCHEMY_DATABASE_URI.replace("sqlite:///", "")
        _db_dir = os.path.dirname(_db_path)
        if _db_dir and not os.path.exists(_db_dir):
            os.makedirs(_db_dir, exist_ok=True)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # StudyOS defaults
    DEFAULT_DAILY_STUDY_GOAL_HOURS = 6.0
    DEFAULT_WEEKLY_STUDY_GOAL_HOURS = 40.0
