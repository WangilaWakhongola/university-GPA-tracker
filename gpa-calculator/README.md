# GPACalc — Student GPA & CGPA Calculator

A full-stack web application for university students to track academic performance, calculate semester GPA and cumulative CGPA, and generate professional reports.

---

## Features

- **Course management** — add, edit, and delete courses with name, code, credit hours, and grade
- **Automatic GPA calculation** — semester GPA recalculated instantly on every change
- **CGPA tracking** — cumulative GPA computed across all semesters with weighted credits
- **Multiple grading scales** — 4.0 (US/International), 5.0 (Nigerian/West African), 7.0 (Australian)
- **Grade classification** — First Class, Second Class Upper, Second Class Lower, Pass, Fail
- **Visual reports** — GPA trend line chart, bar chart by semester, grade distribution pie chart
- **Export** — download full academic report as CSV or PDF
- **User authentication** — register, login, logout with JWT
- **Dark mode** — full light/dark theme with system preference detection
- **Mobile responsive** — works on all screen sizes

---

## Screenshots

### Login Page
Split-panel layout: left side shows brand + tagline, right side has email/password form with demo account fill button.

### Dashboard
- CGPA stat card (large, highlighted in blue)
- Semesters, Credits, Courses count cards
- Grade classification banner
- GPA trend line chart (semester GPA + CGPA overlay)
- Recent semesters table with quick GPA view

### Semesters List
- Collapsible "Add Semester" form (term, year, custom name)
- Cards for each semester showing name, course count, credit hours, GPA
- Open / Delete actions per semester

### Semester Detail
- Breadcrumb navigation
- Add course form (name, code, credit hours, grade dropdown)
- Course table with inline edit rows
- Totals row showing credit hours and semester GPA

### Reports Page
- Summary stat cards
- GPA trend line chart
- Semester GPA bar chart
- Grade distribution pie chart
- Full semester breakdown table
- Export CSV / Export PDF buttons

### Settings Page
- Personal info form (name, university, program)
- Grading scale selector (radio buttons with descriptions)
- Change password section

---

## Project Structure

```
gpa-calculator/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── database.py         # SQLAlchemy models (User, Semester, Course)
│   ├── seed.py             # Sample data seeder
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── semesters.py    # /api/semesters/*
│   │   ├── courses.py      # /api/courses/*
│   │   └── stats.py        # /api/stats/*
│   └── utils/
│       └── gpa.py          # GPA math & grading scale tables
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   ├── AuthContext.jsx   # JWT auth state
        │   └── ThemeContext.jsx  # Dark mode state
        ├── components/
        │   ├── Layout.jsx        # Sidebar + topbar shell
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Semesters.jsx
        │   ├── SemesterDetail.jsx
        │   ├── Reports.jsx
        │   └── Profile.jsx
        └── utils/
            ├── api.js            # Axios instance with JWT injection
            └── gpa.js            # Client-side GPA helpers
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    university    TEXT,
    program       TEXT,
    grading_scale TEXT DEFAULT '4.0',  -- '4.0' | '5.0' | '7.0'
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Semesters
CREATE TABLE semesters (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,           -- e.g. "Fall 2023"
    year       INTEGER NOT NULL,
    term       TEXT NOT NULL,           -- "Fall" | "Spring" | "Summer" | "Winter"
    gpa        REAL DEFAULT 0.0,        -- cached, recomputed on course change
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    semester_id  INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    code         TEXT,                  -- e.g. "CS101"
    credit_hours REAL NOT NULL,
    grade        TEXT NOT NULL,         -- e.g. "A", "B+", "C"
    grade_point  REAL NOT NULL,         -- e.g. 4.0, 3.3, 2.0
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Auth
| Method | Endpoint            | Description             | Auth |
|--------|---------------------|-------------------------|------|
| POST   | /api/auth/register  | Create new account      | ✗    |
| POST   | /api/auth/login     | Sign in, get JWT token  | ✗    |
| GET    | /api/auth/profile   | Get current user        | ✓    |
| PUT    | /api/auth/profile   | Update profile/password | ✓    |

### Semesters
| Method | Endpoint                   | Description            | Auth |
|--------|----------------------------|------------------------|------|
| GET    | /api/semesters/            | List all semesters     | ✓    |
| POST   | /api/semesters/            | Create semester        | ✓    |
| GET    | /api/semesters/:id         | Get semester + courses | ✓    |
| PUT    | /api/semesters/:id         | Update semester        | ✓    |
| DELETE | /api/semesters/:id         | Delete semester        | ✓    |

### Courses
| Method | Endpoint                        | Description         | Auth |
|--------|---------------------------------|---------------------|------|
| POST   | /api/courses/semester/:id       | Add course          | ✓    |
| PUT    | /api/courses/:id                | Edit course         | ✓    |
| DELETE | /api/courses/:id                | Delete course       | ✓    |

### Stats
| Method | Endpoint              | Description                   | Auth |
|--------|-----------------------|-------------------------------|------|
| GET    | /api/stats/dashboard  | CGPA, classification, totals  | ✓    |
| GET    | /api/stats/trend      | GPA trend by semester         | ✓    |
| GET    | /api/stats/export/csv | Download CSV report           | ✓    |
| GET    | /api/stats/scales     | All grading scale tables      | ✗    |

---

## Grading Scales

### 4.0 Scale (Default)
| Grade | Points | | Grade | Points |
|-------|--------|-|-------|--------|
| A+ / A | 4.0  | | C+    | 2.3    |
| A-     | 3.7  | | C     | 2.0    |
| B+     | 3.3  | | C-    | 1.7    |
| B      | 3.0  | | D     | 1.0    |
| B-     | 2.7  | | F     | 0.0    |

### Grade Classification (4.0 Scale)
| CGPA       | Classification      |
|------------|---------------------|
| 3.60–4.00  | First Class         |
| 3.00–3.59  | Second Class Upper  |
| 2.00–2.99  | Second Class Lower  |
| 1.00–1.99  | Pass                |
| 0.00–0.99  | Fail                |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: seed with demo data
python seed.py

# Start server
python app.py
# → Running on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env            # Edit if backend runs on a different port
npm install
npm run dev
# → Running on http://localhost:3000
```

### Demo Account
After seeding:
- **Email:** demo@university.edu
- **Password:** demo1234
- Pre-loaded with 4 semesters of sample data

---

## Environment Variables

### Backend
| Variable        | Default              | Description                 |
|-----------------|----------------------|-----------------------------|
| JWT_SECRET_KEY  | dev-secret-key-...   | **Change in production!**   |

### Frontend
| Variable       | Default                    | Description        |
|----------------|----------------------------|--------------------|
| VITE_API_URL   | http://localhost:5000/api  | Backend API URL    |

---

## Production Deployment

**Backend:** Use Gunicorn behind Nginx
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

**Frontend:** Build and serve static files
```bash
npm run build
# Serve dist/ with Nginx or deploy to Vercel/Netlify
```

**Set environment variables:**
```bash
export JWT_SECRET_KEY="your-secure-random-key-here"
```

---

## Tech Stack

| Layer      | Technology         |
|------------|--------------------|
| Frontend   | React 18 + Vite    |
| Styling    | Tailwind CSS 3     |
| Charts     | Recharts           |
| HTTP       | Axios              |
| Routing    | React Router v7    |
| PDF export | jsPDF              |
| Backend    | Flask (Python)     |
| Auth       | Flask-JWT-Extended |
| Database   | SQLite (SQLAlchemy)|
| CORS       | Flask-CORS         |

---

## License

MIT
