"""
GPA calculation helpers and grading scale definitions
"""

# ── Regions ───────────────────────────────────────────────────────────────────
# Each supported region is locked to exactly one grading scale. A student
# picks their region (not the scale directly) so the scale always matches
# how their institution actually grades.

REGIONS = {
    "us_international": {
        "label": "United States / International",
        "scale": "4.0",
    },
    "nigeria_west_africa": {
        "label": "Nigeria / West Africa",
        "scale": "5.0",
    },
    "australia": {
        "label": "Australia",
        "scale": "7.0",
    },
}


def region_to_scale(region: str) -> str | None:
    """Return the grading scale for a region key, or None if unsupported."""
    entry = REGIONS.get(region)
    return entry["scale"] if entry else None


# ── Grading Scales ─────────────────────────────────────────────────────────────

SCALES = {
    "4.0": {
        "A+": 4.0, "A": 4.0, "A-": 3.7,
        "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7,
        "D+": 1.3, "D": 1.0, "D-": 0.7,
        "F":  0.0,
    },
    "5.0": {
        "A":  5.0, "B": 4.0, "C": 3.0,
        "D":  2.0, "E": 1.0, "F": 0.0,
    },
    "7.0": {
        "HD": 7.0, "D": 6.0, "C": 5.0,
        "P":  4.0, "PC": 3.0, "F": 0.0,
    },
}


def get_grade_point(grade: str, scale: str = "4.0") -> float:
    """Return the numeric grade point for a letter grade on the given scale."""
    table = SCALES.get(scale, SCALES["4.0"])
    return table.get(grade.upper(), 0.0)


def calculate_gpa(courses: list) -> float:
    """
    Compute GPA from a list of dicts with keys: credit_hours, grade_point.
    Returns 0.0 for an empty list.
    """
    total_points  = sum(c["credit_hours"] * c["grade_point"] for c in courses)
    total_credits = sum(c["credit_hours"] for c in courses)
    if total_credits == 0:
        return 0.0
    return round(total_points / total_credits, 2)


def calculate_cgpa(semesters: list) -> float:
    """
    Compute CGPA across multiple semesters.
    Each semester dict must have: gpa, total_credits.
    """
    weighted_sum   = sum(s["gpa"] * s["total_credits"] for s in semesters)
    total_credits  = sum(s["total_credits"] for s in semesters)
    if total_credits == 0:
        return 0.0
    return round(weighted_sum / total_credits, 2)


def classify_gpa(cgpa: float, scale: str = "4.0") -> dict:
    """
    Return grade classification dict:
      { class, description, min_cgpa }
    """
    if scale == "4.0":
        if cgpa >= 3.60:
            return {"class": "First Class",         "description": "Excellent",        "color": "green"}
        elif cgpa >= 3.00:
            return {"class": "Second Class Upper",  "description": "Very Good",        "color": "blue"}
        elif cgpa >= 2.00:
            return {"class": "Second Class Lower",  "description": "Good",             "color": "yellow"}
        elif cgpa >= 1.00:
            return {"class": "Pass",                "description": "Satisfactory",     "color": "orange"}
        else:
            return {"class": "Fail",                "description": "Below Minimum",    "color": "red"}

    elif scale == "5.0":
        if cgpa >= 4.50:
            return {"class": "First Class",         "description": "Excellent",        "color": "green"}
        elif cgpa >= 3.50:
            return {"class": "Second Class Upper",  "description": "Very Good",        "color": "blue"}
        elif cgpa >= 2.40:
            return {"class": "Second Class Lower",  "description": "Good",             "color": "yellow"}
        elif cgpa >= 1.50:
            return {"class": "Pass",                "description": "Satisfactory",     "color": "orange"}
        else:
            return {"class": "Fail",                "description": "Below Minimum",    "color": "red"}

    elif scale == "7.0":
        if cgpa >= 6.00:
            return {"class": "First Class",         "description": "High Distinction", "color": "green"}
        elif cgpa >= 5.00:
            return {"class": "Second Class Upper",  "description": "Distinction",      "color": "blue"}
        elif cgpa >= 4.00:
            return {"class": "Second Class Lower",  "description": "Credit",           "color": "yellow"}
        elif cgpa >= 3.00:
            return {"class": "Pass",                "description": "Pass",             "color": "orange"}
        else:
            return {"class": "Fail",                "description": "Below Minimum",    "color": "red"}

    return {"class": "Unknown", "description": "N/A", "color": "gray"}
