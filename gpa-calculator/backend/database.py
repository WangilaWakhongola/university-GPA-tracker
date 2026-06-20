"""
Database models for GPA Calculator
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    """University student account"""
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name     = db.Column(db.String(120), nullable=False)
    university    = db.Column(db.String(200), nullable=True)
    program       = db.Column(db.String(200), nullable=True)
    grading_scale = db.Column(db.String(20),  default="4.0")  # "4.0" | "5.0" | "7.0"
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    semesters = db.relationship("Semester", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id":            self.id,
            "username":      self.username,
            "email":         self.email,
            "full_name":     self.full_name,
            "university":    self.university,
            "program":       self.program,
            "grading_scale": self.grading_scale,
            "created_at":    self.created_at.isoformat(),
        }


class Semester(db.Model):
    """An academic semester belonging to a user"""
    __tablename__ = "semesters"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name       = db.Column(db.String(100), nullable=False)  # e.g. "Fall 2023"
    year       = db.Column(db.Integer, nullable=False)
    term       = db.Column(db.String(20), nullable=False)   # "Fall" | "Spring" | "Summer"
    gpa        = db.Column(db.Float, default=0.0)           # computed & cached
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    courses = db.relationship("Course", backref="semester", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_courses=False):
        data = {
            "id":         self.id,
            "user_id":    self.user_id,
            "name":       self.name,
            "year":       self.year,
            "term":       self.term,
            "gpa":        round(self.gpa, 2),
            "created_at": self.created_at.isoformat(),
        }
        if include_courses:
            data["courses"] = [c.to_dict() for c in self.courses]
        return data


class Course(db.Model):
    """An individual course in a semester"""
    __tablename__ = "courses"

    id          = db.Column(db.Integer, primary_key=True)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id"), nullable=False)
    name        = db.Column(db.String(200), nullable=False)
    code        = db.Column(db.String(20),  nullable=True)   # e.g. "CS101"
    credit_hours= db.Column(db.Float,  nullable=False)
    grade       = db.Column(db.String(5),  nullable=False)   # e.g. "A", "B+", "C"
    grade_point = db.Column(db.Float,  nullable=False)       # e.g. 4.0, 3.3, 2.0
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "semester_id":  self.semester_id,
            "name":         self.name,
            "code":         self.code,
            "credit_hours": self.credit_hours,
            "grade":        self.grade,
            "grade_point":  self.grade_point,
            "created_at":   self.created_at.isoformat(),
        }
