from app.routes.auth_routes import auth_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.study_routes import study_bp
from app.routes.course_routes import course_bp
from app.routes.exam_routes import exam_bp
from app.routes.reading_routes import reading_bp
from app.routes.goal_routes import goal_bp
from app.routes.question_routes import question_bp
from app.routes.mock_routes import mock_bp
from app.routes.revision_routes import revision_bp
from app.routes.mistake_routes import mistake_bp
from app.routes.notes_routes import notes_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.admin_routes import admin_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(study_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(exam_bp)
    app.register_blueprint(reading_bp)
    app.register_blueprint(goal_bp)
    app.register_blueprint(question_bp)
    app.register_blueprint(mock_bp)
    app.register_blueprint(revision_bp)
    app.register_blueprint(mistake_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)
