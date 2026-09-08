# 🚀 AetherLearn AI — Intelligent Full-Stack Learning Platform

An enterprise-grade, AI-powered e-learning web platform featuring interactive course tracks, real-time AI code tutoring, instant lecture note summarization, automated quiz generation, study planner scheduling, and administrative controls.

---

## ✨ Features

- **🌐 Modern Aesthetic Landing Page** (`/index.html`): High-conversion design with glowing dark/neon space theme, feature showcases, course previews, metrics, and community testimonials.
- **🔐 Secure Authentication** (`/login.html`): JWT authentication, bcrypt password hashing, role-based authorization (Student & Admin), plus 1-click quick demo buttons.
- **📊 Student Dashboard** (`/dashboard.html`): Daily progress metrics, enrolled courses quick-resume, embedded AI note summarizer & quiz generator, upcoming study tasks, and activity logs.
- **📚 Masterclasses & Courses** (`/courses.html`): Filter by category (AI, Web, Cloud, Data) and skill level (Beginner, Intermediate, Advanced) with instant enrollment.
- **📖 Interactive Course Player** (`/course-detail.html`): Modular syllabus tree, interactive lesson reader, lesson completion tracking, and course progress bars.
- **🤖 24/7 AI Code Mentor & Assistant** (`/ai-assistant.html`): Multi-turn interactive AI chat with syntax-highlighted code blocks, quick topic prompts, and custom analogies (OpenAI GPT with contextual fallback).
- **⚡ Interactive Quiz Center** (`/quiz.html`): Timed quiz engine, automated grading, score calculation, detailed question-by-question breakdown, and attempt history.
- **📅 Study Planner & Schedule** (`/planner.html`): Task creation modal, priority badges, due dates, estimated durations, and status filters.
- **📈 Visual Performance Analytics** (`/analytics.html`): Canvas-rendered weekly study hours bar charts, course completion gauges, and learning activity feeds.
- **👤 Profile & Achievements** (`/profile.html`): Profile editing, password change security, and unlockable achievement badges.
- **👑 Admin Portal** (`/admin.html`): Platform overview analytics, user management table (role switching and account deletion), and course creation modal.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Student** | `student@demo.com` | `student123` |
| **Admin** | `admin@demo.com` | `admin123` |

---

## 🚀 Quick Start

### 1. Launch with One Click
Double-click **`Start_Everything.bat`** or **`Run_in_Chrome.bat`** in the root directory. This will start the backend server and open `http://localhost:3001` in your browser.

### 2. Manual Terminal Setup
```bash
# Navigate to backend and install dependencies
cd backend
npm install

# Start the server
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your web browser.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `nedb-promises` (embedded JSON datastore), `multer`, `pdf-parse`, `openai`.
- **Frontend**: Pure Semantic HTML5, Vanilla JavaScript (ES6+), Modern Vanilla CSS (Glassmorphism, Neon/Space palette, responsive layouts), HTML5 Canvas for charts.
- **Zero Heavy Setup**: Embedded persistent database with automated pre-seeding on first run. No external database servers needed.
