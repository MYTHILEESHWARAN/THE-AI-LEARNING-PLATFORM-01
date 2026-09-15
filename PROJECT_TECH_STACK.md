# AetherLearn AI — Project Technology Stack

> **Important:** This document describes the **actual** technologies discovered by inspecting the project source code. Technologies are listed as **Implemented**, **In Progress**, or **Planned** based on their true status.

---

## Frontend

| Layer | Technology | Status |
|---|---|---|
| Markup | HTML5 (Semantic) | ✅ Implemented |
| Scripting | Vanilla JavaScript (ES6+) | ✅ Implemented |
| Styling | Vanilla CSS (Custom Properties, Glassmorphism) | ✅ Implemented |
| UI Framework | None — Pure HTML/CSS/JS | ✅ Implemented |
| Fonts | Google Fonts: Orbitron, Inter, Outfit, Fira Code | ✅ Implemented |
| Charts | HTML5 Canvas (custom rendering) | ✅ Implemented |
| Component Pattern | Multi-page application (MPA) — shared `app.js` utilities | ✅ Implemented |

### Design System
- **Theme:** Dark Space / Neon Glassmorphism
- **Color palette:** CSS custom properties (neon-blue `#00d4ff`, neon-purple `#a855f7`, neon-pink `#f472b6`, neon-green `#10ffb0`)
- **Typography:** Orbitron (headings), Inter (body)
- **Animations:** Twinkling star field, hover transitions, count-up animations, toast notifications
- **Responsive:** CSS grid + flexbox, mobile breakpoints

---

## Backend

| Layer | Technology | Status |
|---|---|---|
| Runtime | Node.js (v18+) | ✅ Implemented |
| Framework | Express.js v4.18.2 | ✅ Implemented |
| API Architecture | REST (JSON responses) | ✅ Implemented |
| Authentication | JWT (`jsonwebtoken` v9.0.2) + `bcryptjs` v2.4.3 | ✅ Implemented |
| File Uploads | Multer v1.4.5 | ✅ Implemented |
| PDF Parsing | pdf-parse v1.1.1 | ✅ Implemented |
| Environment Config | dotenv v16.4.5 | ✅ Implemented |
| CORS | cors v2.8.5 | ✅ Implemented |
| Dev Server | Nodemon v3.1.0 | ✅ Implemented |

---

## Database

| Layer | Technology | Status |
|---|---|---|
| Database | NeDB (via `nedb-promises` v6.2.1) | ✅ Implemented |
| Type | Embedded, file-based JSON document store | ✅ Implemented |
| Storage | Local `.db` files in `backend/data/` | ✅ Implemented |
| External DB server | None required | ✅ (by design) |
| Production-grade DB (e.g., PostgreSQL, MongoDB Atlas) | — | 🔵 Planned |

### NeDB Collections (Actual)
| Collection | File | Purpose |
|---|---|---|
| `users` | `data/users.db` | Student and admin accounts |
| `courses` | `data/courses.db` | Course catalog |
| `modules` | `data/modules.db` | Course modules |
| `lessons` | `data/lessons.db` | Lesson content |
| `enrollments` | `data/enrollments.db` | Course enrollment records |
| `lessonProgress` | `data/progress.db` | Lesson completion tracking |
| `quizzes` | `data/quizzes.db` | Quiz definitions |
| `questions` | `data/questions.db` | Quiz questions + answers |
| `quizAttempts` | `data/attempts.db` | Student quiz attempt history |
| `studyTasks` | `data/tasks.db` | Study planner tasks |
| `achievements` | `data/achievements.db` | Unlocked badges |
| `notifications` | `data/notifications.db` | System notifications |
| `codingProblems` | `data/coding_problems.db` | Practice coding problems |
| `codeSubmissions` | `data/code_submissions.db` | Student code submissions |

---

## AI Integration

| Layer | Technology | Status |
|---|---|---|
| AI Provider | OpenAI | ✅ Implemented |
| Model | GPT-3.5-turbo | ✅ Implemented |
| SDK | `openai` npm package v4.47.1 | ✅ Implemented |
| Mock Fallback | Custom mock responses when no API key | ✅ Implemented |
| AI Chat Tutor | Multi-turn conversation via `/chat` | ✅ Implemented |
| Note Summarizer | Bullet-point summary via `/summarize` | ✅ Implemented |
| Quiz Generator | Auto-generated MCQ from notes via `/quiz` | ✅ Implemented |
| Code Feedback | Educational AI hints for student code submissions | ✅ Implemented |
| API Key Security | Server-side only, never exposed to frontend | ✅ Implemented |

---

## Development & Tooling

| Tool | Technology | Status |
|---|---|---|
| Version Control | Git | ✅ Implemented |
| Repository | GitHub | ✅ Implemented |
| Package Manager | npm | ✅ Implemented |
| Environment Variables | `.env` file (gitignored) + `.env.example` | ✅ Implemented |
| Static File Serving | Express serves `../frontend` as static | ✅ Implemented |
| Start Script | `Start_Everything.bat` / `Run_in_Chrome.bat` | ✅ Implemented |
| Production Build | None (MPA, no bundler needed) | ✅ (by design) |
| Testing Framework | None formal | 🟡 In Progress |
| CI/CD Pipeline | None | 🔵 Planned |
| Container / Docker | None | 🔵 Planned |
| Real Code Sandbox | None — mock execution layer used | 🔵 Planned |

---

## Security

| Feature | Status |
|---|---|
| JWT authentication with 7-day expiry | ✅ Implemented |
| bcrypt password hashing (salt rounds: 12) | ✅ Implemented |
| Role-based access control (student / admin) | ✅ Implemented |
| API key stored server-side in `.env` | ✅ Implemented |
| `.env` excluded from git | ✅ Implemented |
| CORS configured | ✅ Implemented |
| Input validation on all auth endpoints | ✅ Implemented |
| Code execution sandboxing | 🔵 Planned (mock layer in use) |
| Rate limiting | 🔵 Planned |
| HTTPS / TLS | 🔵 Planned (deploy-time) |

---

## Summary

```
AetherLearn AI
│
├── Frontend (HTML5 + Vanilla JS + CSS)
│   ├── 12 HTML pages
│   ├── 11 JS modules
│   └── 4 CSS files (glassmorphism design system)
│
├── Backend (Node.js + Express.js)
│   ├── 12 API route files
│   ├── JWT auth middleware
│   └── OpenAI integration with mock fallback
│
└── Database (NeDB — embedded)
    └── 14 collections, auto-seeded on first run
```

> **Zero external dependencies:** No external database server, no cloud service, no build step required. Works offline with mock AI responses when no OpenAI API key is configured.
