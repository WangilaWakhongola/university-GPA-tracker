"""
Statistics & dashboard routes — CGPA, trend data, export (CSV/PDF)
"""

import io
import csv
from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import User, Semester, Course
from utils.gpa import calculate_cgpa, classify_gpa

stats_bp = Blueprint("stats", __name__)


def _user_semesters(user_id):
    return (Semester.query
            .filter_by(user_id=user_id)
            .order_by(Semester.year.asc(), Semester.id.asc())
            .all())


@stats_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    sems    = _user_semesters(user_id)

    # Build semester summaries
    sem_data = []
    for s in sems:
        total_credits = sum(c.credit_hours for c in s.courses)
        sem_data.append({
            "id":            s.id,
            "name":          s.name,
            "year":          s.year,
            "term":          s.term,
            "gpa":           round(s.gpa, 2),
            "total_credits": total_credits,
            "course_count":  len(s.courses),
        })

    # CGPA
    cgpa = calculate_cgpa(sem_data)

    # Grade distribution across all courses
    all_courses   = [c for s in sems for c in s.courses]
    total_credits = sum(c.credit_hours for c in all_courses)
    grade_dist    = {}
    for c in all_courses:
        grade_dist[c.grade] = grade_dist.get(c.grade, 0) + 1

    # Classification
    classification = classify_gpa(cgpa, user.grading_scale)

    return jsonify({
        "cgpa":           cgpa,
        "classification": classification,
        "total_credits":  total_credits,
        "total_courses":  len(all_courses),
        "total_semesters": len(sems),
        "semesters":      sem_data,
        "grade_distribution": grade_dist,
    }), 200


@stats_bp.route("/trend", methods=["GET"])
@jwt_required()
def trend():
    user_id = int(get_jwt_identity())
    sems    = _user_semesters(user_id)

    trend_data = []
    running_credits = 0
    running_points  = 0

    for s in sems:
        total_credits = sum(c.credit_hours for c in s.courses)
        running_credits += total_credits
        running_points  += s.gpa * total_credits
        cgpa = round(running_points / running_credits, 2) if running_credits else 0

        trend_data.append({
            "semester":       s.name,
            "semester_gpa":   round(s.gpa, 2),
            "cgpa":           cgpa,
            "total_credits":  running_credits,
        })

    return jsonify(trend_data), 200


@stats_bp.route("/export/csv", methods=["GET"])
@jwt_required()
def export_csv():
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    sems    = _user_semesters(user_id)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header block
    writer.writerow(["Student:", user.full_name])
    writer.writerow(["University:", user.university or ""])
    writer.writerow(["Program:", user.program or ""])
    writer.writerow([])

    # Per-semester course tables
    writer.writerow(["Semester", "Course Code", "Course Name",
                     "Credit Hours", "Grade", "Grade Points"])

    for s in sems:
        for c in s.courses:
            writer.writerow([
                s.name, c.code, c.name,
                c.credit_hours, c.grade, c.grade_point
            ])
        writer.writerow([s.name, "", "Semester GPA", "", "", round(s.gpa, 2)])
        writer.writerow([])

    response = make_response(output.getvalue())
    response.headers["Content-Type"]        = "text/csv"
    response.headers["Content-Disposition"] = "attachment; filename=gpa_report.csv"
    return response


# ── Grading scale reference ────────────────────────────────────────────────────

@stats_bp.route("/scales", methods=["GET"])
def get_scales():
    """Return all supported grading scales."""
    from utils.gpa import SCALES
    return jsonify(SCALES), 200
