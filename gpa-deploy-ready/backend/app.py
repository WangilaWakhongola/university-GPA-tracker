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
    # DATABASE_URL lets you point at Postgres in production (e.g. Render/Railway
    # managed Postgres). Falls back to local SQLite for dev. Some hosts hand out
    # "postgres://" URLs, which SQLAlchemy 1.4+ needs as "postgresql://".
    db_url = os.environ.get("DATABASE_URL", "sqlite:///gpa_calculator.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    jwt_secret = os.environ.get("JWT_SECRET_KEY")
    if not jwt_secret:
        if os.environ.get("FLASK_ENV") == "production":
            raise RuntimeError(
                "JWT_SECRET_KEY must be set in production. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        jwt_secret = "dev-secret-key-change-in-production"
    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours

    # ── Extensions ─────────────────────────────────────────────────────────────
    db.init_app(app)
    JWTManager(app)
    # FRONTEND_URL restricts CORS to your deployed frontend in production.
    # Leave unset locally to allow any origin during dev.
    frontend_url = os.environ.get("FRONTEND_URL")
    cors_origins = frontend_url if frontend_url else "*"
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})

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
