"""
Course CRUD routes — handles add / edit / delete courses within a semester
and auto-recomputes semester GPA after each mutation.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User, Semester, Course
from utils.gpa import get_grade_point, calculate_gpa

courses_bp = Blueprint("courses", __name__)


def _owned_semester(user_id, semester_id):
    return Semester.query.filter_by(id=semester_id, user_id=user_id).first_or_404()


def _recompute_semester_gpa(semester: Semester):
    courses = [{"credit_hours": c.credit_hours, "grade_point": c.grade_point}
               for c in semester.courses]
    semester.gpa = calculate_gpa(courses)
    db.session.commit()


@courses_bp.route("/semester/<int:semester_id>", methods=["POST"])
@jwt_required()
def add_course(semester_id):
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    sem     = _owned_semester(user_id, semester_id)
    data    = request.get_json()

    required = ["name", "credit_hours", "grade"]
    for f in required:
        if not data.get(f) and data.get(f) != 0:
            return jsonify({"error": f"{f} is required"}), 400

    grade_point = get_grade_point(data["grade"], user.grading_scale)

    course = Course(
        semester_id  = semester_id,
        name         = data["name"],
        code         = data.get("code", ""),
        credit_hours = float(data["credit_hours"]),
        grade        = data["grade"].upper(),
        grade_point  = grade_point,
    )
    db.session.add(course)
    db.session.flush()

    _recompute_semester_gpa(sem)
    return jsonify(course.to_dict()), 201


@courses_bp.route("/<int:course_id>", methods=["PUT"])
@jwt_required()
def update_course(course_id):
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    course  = Course.query.get_or_404(course_id)
    sem     = _owned_semester(user_id, course.semester_id)
    data    = request.get_json()

    if "name" in data:
        course.name = data["name"]
    if "code" in data:
        course.code = data["code"]
    if "credit_hours" in data:
        course.credit_hours = float(data["credit_hours"])
    if "grade" in data:
        course.grade       = data["grade"].upper()
        course.grade_point = get_grade_point(data["grade"], user.grading_scale)

    _recompute_semester_gpa(sem)
    return jsonify(course.to_dict()), 200


@courses_bp.route("/<int:course_id>", methods=["DELETE"])
@jwt_required()
def delete_course(course_id):
    user_id = int(get_jwt_identity())
    course  = Course.query.get_or_404(course_id)
    sem     = _owned_semester(user_id, course.semester_id)

    db.session.delete(course)
    db.session.flush()
    _recompute_semester_gpa(sem)
    return jsonify({"message": "Course deleted"}), 200
