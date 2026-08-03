"""
Semester CRUD routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User, Semester, Course
from utils.gpa import calculate_gpa, get_grade_point
from utils.transcript import extract_text, parse_courses, TranscriptParseError, MAX_PDF_BYTES

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


@semesters_bp.route("/<int:semester_id>/transcript/parse", methods=["POST"])
@jwt_required()
def parse_transcript(semester_id):
    """Upload a PDF transcript and get back a preview list of detected
    courses. Nothing is saved yet — the student reviews/edits, then calls
    /transcript/confirm with the (possibly edited) list."""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    _owned_semester(user_id, semester_id)  # 404s if not owned

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a PDF file"}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_PDF_BYTES:
        return jsonify({"error": "File too large. Max size is 8 MB."}), 400

    try:
        text = extract_text(file)
    except TranscriptParseError as e:
        return jsonify({"error": str(e)}), 422

    courses = parse_courses(text, user.grading_scale)

    if not courses:
        return jsonify({
            "error": "Couldn't find any course rows in this PDF. Expected lines like "
                     "'CS401 Software Engineering 3 A' — you can enter courses manually instead.",
            "parsed_courses": [],
        }), 422

    return jsonify({
        "parsed_courses": courses,
        "grading_scale":  user.grading_scale,
        "count":          len(courses),
    }), 200


@semesters_bp.route("/<int:semester_id>/transcript/confirm", methods=["POST"])
@jwt_required()
def confirm_transcript(semester_id):
    """Save a (student-reviewed, possibly edited) list of parsed courses."""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    sem  = _owned_semester(user_id, semester_id)
    data = request.get_json()

    rows = data.get("courses")
    if not rows or not isinstance(rows, list):
        return jsonify({"error": "courses (a non-empty list) is required"}), 400

    created = []
    for i, row in enumerate(rows):
        for field in ["name", "credit_hours", "grade"]:
            if not row.get(field) and row.get(field) != 0:
                return jsonify({"error": f"Row {i + 1}: {field} is required"}), 400
        try:
            credit_hours = float(row["credit_hours"])
        except (TypeError, ValueError):
            return jsonify({"error": f"Row {i + 1}: invalid credit_hours"}), 400
        if credit_hours <= 0 or credit_hours > 12:
            return jsonify({"error": f"Row {i + 1}: credit_hours out of range"}), 400

        grade = str(row["grade"]).upper()
        grade_point = get_grade_point(grade, user.grading_scale)

        course = Course(
            semester_id  = semester_id,
            name         = row["name"],
            code         = row.get("code", ""),
            credit_hours = credit_hours,
            grade        = grade,
            grade_point  = grade_point,
        )
        db.session.add(course)
        created.append(course)

    db.session.flush()
    _recompute_gpa(sem)

    return jsonify({
        "semester": sem.to_dict(include_courses=True),
        "added":    len(created),
    }), 201


@semesters_bp.route("/<int:semester_id>", methods=["DELETE"])
@jwt_required()
def delete_semester(semester_id):
    user_id = int(get_jwt_identity())
    sem = _owned_semester(user_id, semester_id)
    db.session.delete(sem)
    db.session.commit()
    return jsonify({"message": "Semester deleted"}), 200
