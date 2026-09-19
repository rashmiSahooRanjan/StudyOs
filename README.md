# StudyOS: Personal Learning, Productivity & Competitive Examination Tracking System

> Complete implementation based on `StudyOS_Full_Project_Documentation.pdf` (React.js + Python Flask + SQLite + Deterministic Rule Intelligence).

## Key Architectural Principles
- **100% Zero-Cost / Offline-First**: Works completely without paid external AI APIs (OpenAI, Gemini, ChatGPT, Claude).
- **Rule-Based Recommendation Engine**: Implements rules R1 to R8 (overdue revision alerts, weak topic identification, study balance alerts, and repeated mistake intervention).
- **Spaced Repetition Scheduler**: Spaced intervals (+1, +3, +7, +14, +30 days) with adaptive interval shifting.
- **Study DNA**: Descriptive statistics and pattern extraction from your own logged data.

---

## Quick Start (One-Click Launcher)
Double-click `run_app.bat` or run:
```cmd
run_app.bat
```
This automatically starts both the Flask backend and the React frontend, and opens `http://localhost:5173`.

---

## Production Deployment (Docker & Compose)

To deploy to any cloud server (AWS, DigitalOcean, Hetzner, etc.) or VPS:
```bash
cp .env.example .env
docker compose up -d --build
```
See [DEPLOYMENT.md](DEPLOYMENT.md) for the full VPS setup guide, custom domain setup, and free SSL configuration.

---

## Manual Execution

### 1. Backend Server
```powershell
cd backend
python run.py
```
Backend API will be running on `http://localhost:5000`.

### 2. Frontend Development Server
```powershell
cd frontend
npm run dev
```
Frontend Web App will be running on `http://localhost:5173`.

---

## Core Features Included
1. **Dashboard**: Daily study time, goal progress ring, Rule R1–R8 priorities, active alerts, subject breakdown.
2. **Focus Room / Study Timer**: Pomodoro & stopwatch modes, circular progress ring, real-time distraction logging, and ambient noise synthesizer.
3. **Courses & Syllabus**: Academic programs, subject completion progress bars, and hierarchical topic explorer.
4. **Competitive Exams**: Exam countdown clocks (GATE CSE 2027, etc.), target scores, and rank goals.
5. **PYQ & Question Bank**: Interactive practice mode with instant explanations and automatic mistake book linking.
6. **Mock Test Arena**: Section accuracy radar & bar charts, score history, and recurring weak spot detection.
7. **Spaced Revision & Flashcards**: Spaced queue and interactive 3D flip flashcard player.
8. **Mistake Book**: Diagnostic error categorizations (`concept gap`, `careless error`, `time pressure`, etc.) with reattempt verification.
9. **Reading Tracker**: Bookshelf view and reading pace (pages/hour) calculations.
10. **Calendar Planner**: Plan vs. actual study comparison and one-click smart task rollover.
11. **Study DNA & Analytics**: Peak productive hours, 90-day activity heatmap, and earned milestone badges.
12. **Notes Library**: Markdown knowledge base with tagging, search, and formulas.
13. **Settings & Data Ownership**: Complete JSON database backup and CSV session logs export.
