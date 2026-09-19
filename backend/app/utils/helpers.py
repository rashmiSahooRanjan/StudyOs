from functools import wraps
from flask import request, jsonify
import jwt
from app.config import Config
from app.models.user import User

def generate_token(user_id):
    import datetime
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def get_current_user():
    """
    Extracts authenticated user from Authorization Bearer token.
    Strictly isolated per user session.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
        if token and token != "null" and token != "undefined":
            try:
                data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
                user_id = data.get("user_id")
                if user_id:
                    from app.extensions import db
                    user = db.session.get(User, user_id)
                    if user:
                        return user
            except Exception as e:
                return None
    return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required. Please sign in."}), 401
        return f(user, *args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required. Please sign in as admin."}), 401
        if not user.is_admin:
            return jsonify({"error": "Access denied. Administrator privileges required."}), 403
        return f(user, *args, **kwargs)
    return decorated
