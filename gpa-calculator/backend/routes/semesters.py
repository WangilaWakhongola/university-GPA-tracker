"""
Semester CRUD routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User, Semester, Course
from utils.gpa import calculate_gpa

semesters_bp = Blueprint("semesters", __name__)


def _owned_semester(user_id, semester_id):
    return Semester.query.filter_by(id=semester_id, user_id=user_id).first_or_404()


def _recompute_gpa(semester: Semester):
    """Recompute and persist GPA for a semester from its courses."""
    courses = [{"credit_hours": c.credit_hours, "grade_point": c.grade_point}
               for c in semester.courses]
    semester.gpa = calculate_gpa(courses)
    db.session.commit()


@semesters_bp.route("/", methods=["GET"])
@jwt_required()
def list_semesters():
    user_id = int(get_jwt_identity())
    semesters = (Semester.query
                 .filter_by(user_id=user_id)
                 .order_by(Semester.year.desc(), Semester.id.desc())
                 .all())
    return jsonify([s.to_dict(include_courses=True) for s in semesters]), 200


@semesters_bp.route("/", methods=["POST"])
@jwt_required()
def create_semester():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get("name") or not data.get("year") or not data.get("term"):
        return jsonify({"error": "name, year, and term are required"}), 400

    sem = Semester(
        user_id = user_id,
        name    = data["name"],
        year    = int(data["year"]),
        term    = data["term"],
        gpa     = 0.0,
    )
    db.session.add(sem)
    db.session.commit()
    return jsonify(sem.to_dict(include_courses=True)), 201


@semesters_bp.route("/<int:semester_id>", methods=["GET"])
@jwt_required()
def get_semester(semester_id):
    user_id = int(get_jwt_identity())
    sem = _owned_semester(user_id, semester_id)
    return jsonify(sem.to_dict(include_courses=True)), 200


@semesters_bp.route("/<int:semester_id>", methods=["PUT"])
@jwt_required()
def update_semester(semester_id):
    user_id = int(get_jwt_identity())
    sem = _owned_semester(user_id, semester_id)
    data = request.get_json()

    for field in ["name", "year", "term"]:
        if field in data:
            setattr(sem, field, data[field])

    db.session.commit()
    return jsonify(sem.to_dict(include_courses=True)), 200


@semesters_bp.route("/<int:semester_id>", methods=["DELETE"])
@jwt_required()
def delete_semester(semester_id):
    user_id = int(get_jwt_identity())
    sem = _owned_semester(user_id, semester_id)
    db.session.delete(sem)
    db.session.commit()
    return jsonify({"message": "Semester deleted"}), 200
