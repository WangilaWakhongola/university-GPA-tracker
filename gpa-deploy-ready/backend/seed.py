"""
Seed the database with a demo student account and sample academic records.
Run: python seed.py
"""

from app import create_app
from database import db, User, Semester, Course
from utils.gpa import get_grade_point, calculate_gpa

SAMPLE_SEMESTERS = [
    {
        "name": "Fall 2022", "year": 2022, "term": "Fall",
        "courses": [
            {"name": "Introduction to Computer Science", "code": "CS101", "credit_hours": 3, "grade": "A"},
            {"name": "Calculus I",                       "code": "MTH101","credit_hours": 4, "grade": "B+"},
            {"name": "Technical Writing",                "code": "ENG101","credit_hours": 2, "grade": "A"},
            {"name": "Physics I",                        "code": "PHY101","credit_hours": 3, "grade": "B"},
        ],
    },
    {
        "name": "Spring 2023", "year": 2023, "term": "Spring",
        "courses": [
            {"name": "Data Structures",                  "code": "CS201", "credit_hours": 3, "grade": "A-"},
            {"name": "Calculus II",                      "code": "MTH102","credit_hours": 4, "grade": "B"},
            {"name": "Discrete Mathematics",             "code": "MTH201","credit_hours": 3, "grade": "B+"},
            {"name": "Physics II",                       "code": "PHY102","credit_hours": 3, "grade": "A"},
        ],
    },
    {
        "name": "Fall 2023", "year": 2023, "term": "Fall",
        "courses": [
            {"name": "Algorithms",                       "code": "CS301", "credit_hours": 3, "grade": "A"},
            {"name": "Database Systems",                 "code": "CS302", "credit_hours": 3, "grade": "A-"},
            {"name": "Linear Algebra",                   "code": "MTH301","credit_hours": 3, "grade": "B+"},
            {"name": "Operating Systems",                "code": "CS303", "credit_hours": 3, "grade": "B"},
        ],
    },
    {
        "name": "Spring 2024", "year": 2024, "term": "Spring",
        "courses": [
            {"name": "Software Engineering",             "code": "CS401", "credit_hours": 3, "grade": "A"},
            {"name": "Computer Networks",                "code": "CS402", "credit_hours": 3, "grade": "B+"},
            {"name": "Machine Learning",                 "code": "CS403", "credit_hours": 3, "grade": "A-"},
            {"name": "Ethics in Technology",             "code": "GEN401","credit_hours": 2, "grade": "A"},
        ],
    },
]


def seed():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Demo user
        user = User(
            username      = "demo",
            email         = "demo@university.edu",
            full_name     = "Alex Johnson",
            university    = "State University of Technology",
            program       = "B.Sc. Computer Science",
            region        = "us_international",
            grading_scale = "4.0",
        )
        user.set_password("demo1234")
        db.session.add(user)
        db.session.flush()

        for sem_data in SAMPLE_SEMESTERS:
            sem = Semester(
                user_id = user.id,
                name    = sem_data["name"],
                year    = sem_data["year"],
                term    = sem_data["term"],
            )
            db.session.add(sem)
            db.session.flush()

            course_list = []
            for c_data in sem_data["courses"]:
                gp = get_grade_point(c_data["grade"], "4.0")
                course = Course(
                    semester_id  = sem.id,
                    name         = c_data["name"],
                    code         = c_data["code"],
                    credit_hours = c_data["credit_hours"],
                    grade        = c_data["grade"],
                    grade_point  = gp,
                )
                db.session.add(course)
                course_list.append({"credit_hours": c_data["credit_hours"], "grade_point": gp})

            sem.gpa = calculate_gpa(course_list)

        db.session.commit()
        print("✓ Database seeded successfully.")
        print("  Demo login → email: demo@university.edu | password: demo1234")


if __name__ == "__main__":
    seed()
