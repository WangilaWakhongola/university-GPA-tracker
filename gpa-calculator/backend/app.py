"""
GPA Calculator - Flask Backend
Main application entry point
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db
import os

def create_app():
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────────────────────
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///gpa_calculator.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours

    # ── Extensions ─────────────────────────────────────────────────────────────
    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Blueprints ─────────────────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.semesters import semesters_bp
    from routes.courses import courses_bp
    from routes.stats import stats_bp

    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(semesters_bp, url_prefix="/api/semesters")
    app.register_blueprint(courses_bp,   url_prefix="/api/courses")
    app.register_blueprint(stats_bp,     url_prefix="/api/stats")

    # ── Create tables & seed sample data ──────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
