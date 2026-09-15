# AetherLearn AI — System Architecture

> This document describes the **actual** architecture of the AetherLearn AI platform as discovered through source code inspection. Future/planned components are clearly labelled.

---

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    STUDENT BROWSER                       │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ index.   │ │dashboard │ │courses / │ │  quiz /  │  │
│  │   html   │ │  .html   │ │ lessons  │ │ planner  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │             │             │             │        │
│  ┌────▼─────────────▼─────────────▼─────────────▼────┐  │
│  │              app.js (Shared Utilities)             │  │
│  │  • apiCall()  • authGuard()  • showToast()        │  │
│  │  • logout()   • generateStars()  • setupSidebar() │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │ HTTPS REST (JSON)
                        │ Bearer Token (JWT)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              NODE.JS / EXPRESS.JS BACKEND               │
│                    localhost:3001                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Static File Serving                │   │
│  │        express.static("../frontend")            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │            JWT Auth Middleware                  │   │
│  │         verifyToken() + requireAdmin()          │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │                 API Routes                      │   │
│  │  /auth/*        Auth (signup, login)            │   │
│  │  /api/courses   Course catalog & enrollment     │   │
│  │  /api/lessons   Lesson content & progress       │   │
│  │  /api/quizzes   Quiz engine & attempts          │   │
│  │  /api/planner   Study task management           │   │
│  │  /api/analytics Learning statistics             │   │
│  │  /api/achievements  Badge system                │   │
│  │  /api/notifications System alerts               │   │
│  │  /api/profile   User profile management         │   │
│  │  /api/admin     Admin portal (admin-only)       │   │
│  │  /api/coding    Coding practice & submissions   │   │
│  │  /summarize     AI note summarization           │   │
│  │  /quiz          AI quiz generation              │   │
│  │  /chat          AI tutor conversation           │   │
│  │  /api/ai/feedback  AI code feedback             │   │
│  │  /upload        PDF file upload + parse         │   │
│  └──────────────────┬──────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
┌─────────────────┐     ┌──────────────────────┐
│   NeDB DATABASE │     │   OpenAI API          │
│  (file-based)   │     │   GPT-3.5-turbo       │
│                 │     │                      │
│  users.db       │     │  • /chat             │
│  courses.db     │     │  • /summarize        │
│  modules.db     │     │  • /quiz             │
│  lessons.db     │     │  • /api/ai/feedback  │
│  enrollments.db │     │                      │
│  progress.db    │     │  [Mock fallback when │
│  quizzes.db     │     │   no API key set]    │
│  questions.db   │     └──────────────────────┘
│  attempts.db    │
│  tasks.db       │
│  achievements.db│
│  notifications.db│
│  coding_probs.db│
│  submissions.db │
└─────────────────┘
```

---

## AI-Powered Code Feedback Flow

```text
Student writes code in Coding Practice Interface
                    │
                    ▼
         Clicks "Run" button
                    │
                    ▼
         POST /api/code/run
         ┌──────────────────────────────────────┐
         │     Mock Code Execution Layer        │
         │  (Safe — no arbitrary code runs)     │
         │  • Validates language selection      │
         │  • Validates code is not empty       │
         │  • Returns simulated test results    │
         │  [Real sandbox: Planned]             │
         └──────────────────────┬───────────────┘
                                │
                    Execution result returned
                                │
                    ▼
         Student clicks "Submit"
                    │
                    ▼
         POST /api/submissions
         ┌─────────────────────────────────────┐
         │   Submission saved to NeDB          │
         │   (user_id, problem_id, code,       │
         │    language, result, timestamp)     │
         └─────────────────────────────────────┘
                                │
                    ▼
         POST /api/ai/feedback
         ┌─────────────────────────────────────────────────┐
         │          Backend prepares AI prompt              │
         │                                                 │
         │  Input:                                         │
         │  • Problem statement                            │
         │  • Expected behavior / test cases               │
         │  • Student's submitted code                     │
         │  • Execution result / error output              │
         │                                                 │
         │  Instruction to AI:                             │
         │  "Do NOT give the full solution.                │
         │   Provide: detected issue, educational hint,    │
         │   concept explanation, suggested next step."    │
         └──────────────────────┬──────────────────────────┘
                                │
                    ▼
         OpenAI GPT-3.5-turbo
         [or mock response if no key]
                    │
                    ▼
         ┌──────────────────────────────┐
         │  AI Feedback Response:       │
         │  • detected_issue            │
         │  • hint (no direct answer)   │
         │  • concept_explanation       │
         │  • suggested_next_step       │
         └──────────────────────────────┘
                    │
                    ▼
         Frontend AI Feedback Panel
         Student reads, retries, learns
```

---

## Authentication Flow

```text
Student enters credentials
        │
        ▼
POST /auth/login
        │
        ▼
┌────────────────────────────────┐
│  bcrypt.compare(password, hash)│
│  → Verify hashed password      │
└────────────────────┬───────────┘
                     │ Success
                     ▼
         JWT token generated
         (7-day expiry, signed with JWT_SECRET)
                     │
                     ▼
         Stored in localStorage:
         lp_token — JWT bearer token
         lp_user  — name, email, role
                     │
                     ▼
         All API calls → Authorization: Bearer <token>
                     │
                     ▼
         verifyToken() middleware decodes JWT
         Injects req.user = { id, email, name, role }
```

---

## Component Architecture

```text
Multi-Page Application (MPA) — no framework
Each page is a self-contained HTML + JS module

Shared across all pages:
├── css/style.css      — Global design system + tokens
├── css/app.css        — App layout (sidebar, topbar, cards, grids)
├── css/dashboard.css  — Dashboard-specific + auth styles
├── css/auth.css       — Login/signup styles
└── js/app.js          — Shared utilities: auth, API, toasts, sidebar
```

---

## Security Architecture

```text
Secrets:
  OPENAI_API_KEY  ──→  Server only (backend/.env)
  JWT_SECRET      ──→  Server only (backend/.env)
  Never in frontend JS (verified by inspection)

Authentication:
  JWT → 7 days expiry
  bcrypt → 12 salt rounds

Authorization:
  verifyToken()    → All protected routes
  requireAdmin()   → Admin-only routes (/api/admin/*)

Input Validation:
  Auth endpoints   → Name, email, password length checks
  AI endpoints     → Text length, empty checks, max 4000 chars
  Code endpoints   → Language whitelist, length limits

Error Handling:
  All errors → structured JSON { error: "message" }
  No stack traces exposed to users
  AI API errors → human-readable messages
```

---

## Planned Architecture Improvements

| Component | Current | Planned |
| --- | --- | --- |
| Database | NeDB (file-based) | PostgreSQL / MongoDB Atlas |
| Code Execution | Mock layer | Isolated Docker sandbox |
| Auth | JWT in localStorage | HttpOnly cookies + CSRF |
| Rate Limiting | None | express-rate-limit |
| HTTPS | None (local) | TLS via reverse proxy (deploy) |
| CI/CD | None | GitHub Actions |
| Monitoring | console.log | Structured logging + alerting |

---

Generated: September 2026 — AetherLearn AI Platform v2.0
