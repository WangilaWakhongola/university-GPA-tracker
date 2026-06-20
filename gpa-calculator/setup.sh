#!/usr/bin/env bash
# setup.sh — one-shot dev environment setup

set -e

echo ""
echo "═══════════════════════════════════════"
echo "  GPACalc — Setup Script"
echo "═══════════════════════════════════════"
echo ""

# ── Backend ───────────────────────────────
echo "▶ Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "  ✓ Virtual environment created"
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo "  ✓ Python packages installed"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ✓ Created backend/.env from example"
fi

python seed.py
echo "  ✓ Database seeded with demo data"

deactivate
cd ..

# ── Frontend ──────────────────────────────
echo ""
echo "▶ Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ✓ Created frontend/.env from example"
fi

npm install --silent
echo "  ✓ Node packages installed"
cd ..

# ── Done ──────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Start backend:   cd backend && source venv/bin/activate && python app.py"
echo "  Start frontend:  cd frontend && npm run dev"
echo ""
echo "  Demo account:"
echo "    Email:    demo@university.edu"
echo "    Password: demo1234"
echo "═══════════════════════════════════════"
echo ""
