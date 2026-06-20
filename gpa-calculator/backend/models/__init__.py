# models package — re-export from database.py
from database import db, User, Semester, Course

__all__ = ["db", "User", "Semester", "Course"]
