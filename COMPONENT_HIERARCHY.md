# AetherLearn AI — Frontend Component Hierarchy

> This document maps the actual frontend structure of the AetherLearn AI platform, based on inspection of all HTML and JavaScript source files.

---

## Application Architecture Pattern

**Multi-Page Application (MPA)** — No JavaScript framework (Vue, React, Angular).
Each page is a standalone HTML file with its own JavaScript module, sharing a common utility layer via `app.js`.

---

## Full Component Hierarchy

```text
AetherLearn AI (MPA — 12 HTML Pages)
│
├── 🌐 SHARED INFRASTRUCTURE
│   ├── css/style.css          — Global design tokens, animations, utilities
│   ├── css/app.css            — App shell layout (sidebar, topbar, cards, grids)
│   ├── css/dashboard.css      — Page-specific styles (dashboard, progress bars)
│   ├── css/auth.css           — Authentication page styles
│   └── js/app.js              — Shared JS utilities
│       ├── getToken()         — JWT retrieval from localStorage
│       ├── getUser()          — User object from localStorage
│       ├── authGuard()        — Redirect unauthenticated users
│       ├── logout()           — Clear auth + redirect
│       ├── apiCall()          — Fetch wrapper with auth headers
│       ├── showToast()        — Slide-in notification toasts
│       ├── generateStars()    — Animated star field background
│       ├── setupSidebar()     — Sidebar user info + mobile toggle
│       ├── loadNotificationBadge() — Unread count from API
│       ├── timeAgo()          — Human-readable timestamps
│       ├── escapeHtml()       — XSS prevention
│       ├── formatDate()       — Date formatting
│       ├── createProgressBar() — HTML progress bar generator
│       └── animateCount()     — Animated number counting
│
├── 🏠 PUBLIC PAGES (No auth required)
│   │
│   ├── index.html  [Landing Page]
│   │   ├── Navigation Bar
│   │   │   ├── Brand (AetherLearn AI logo + name)
│   │   │   ├── Nav Links (Features, Courses, AI Tutor, Community)
│   │   │   ├── Sign In button → login.html
│   │   │   └── Get Started Free → login.html?tab=signup
│   │   ├── Hero Section
│   │   │   ├── Badge ("Powered by Next-Gen AI")
│   │   │   ├── Headline (animated gradient text)
│   │   │   ├── Subtitle
│   │   │   ├── CTA Buttons (Start Free / Explore Demo)
│   │   │   └── Quick Stats (Quiz pass rate, Students, Lessons, Rating)
│   │   ├── Features Grid (3-column)
│   │   │   ├── AI Code Mentor card
│   │   │   ├── PDF & Notes Summarizer card
│   │   │   ├── Auto-Generated Quizzes card
│   │   │   ├── Smart Study Planner card
│   │   │   ├── Real-Time Analytics card
│   │   │   └── Gamified Milestones card
│   │   ├── Popular Courses Preview (3 course cards)
│   │   ├── CTA Banner
│   │   └── Footer
│   │       app.js → generateStars()
│   │
│   └── login.html  [Authentication Page]
│       ├── Brand header
│       ├── Tab Toggle (Login / Sign Up)
│       ├── Login Form
│       │   ├── Email input
│       │   ├── Password input
│       │   ├── Submit button → POST /auth/login
│       │   └── Demo buttons (Student / Admin quick login)
│       ├── Signup Form
│       │   ├── Name input
│       │   ├── Email input
│       │   ├── Password input
│       │   └── Submit button → POST /auth/signup
│       └── Switch tab links
│           js/auth.js
│
├── 📊 AUTHENTICATED APP SHELL (Shared across all app pages)
│   ├── Star Background Container
│   ├── App Container (CSS grid: sidebar + main)
│   ├── Sidebar (aside.app-sidebar)
│   │   ├── Brand (logo + name)
│   │   ├── Navigation Menu
│   │   │   ├── Dashboard link
│   │   │   ├── Courses link
│   │   │   ├── AI Tutor link
│   │   │   ├── Quiz Center link
│   │   │   ├── Coding Practice link ← NEW
│   │   │   ├── Study Planner link
│   │   │   ├── Analytics link
│   │   │   ├── My Profile link
│   │   │   └── Admin Portal link (admin-only)
│   │   └── Sidebar Footer
│   │       ├── User Avatar (initial letter)
│   │       ├── User Name
│   │       ├── Role Badge (Student / Admin)
│   │       └── Logout button
│   └── Main Content Area (main.app-main)
│       └── Top Bar (header.app-topbar)
│           ├── Page Title + Subtitle
│           └── Action Buttons (context-specific)
│
├── 📚 DASHBOARD  (dashboard.html + js/dashboard.js)
│   ├── Stats Grid (4 columns)
│   │   ├── Enrolled Courses count
│   │   ├── Lessons Completed count
│   │   ├── Quizzes Solved count
│   │   └── Badges Unlocked count
│   ├── Continue Learning Panel
│   │   └── Enrolled course cards (progress bar, resume button)
│   ├── Quick AI Study Tools Panel
│   │   ├── Notes/Excerpt Textarea
│   │   ├── Generate Summary button → POST /summarize
│   │   ├── Generate Quiz button → POST /quiz
│   │   └── Results display area
│   ├── Study Planner Tasks Preview
│   │   └── Task items (title, due date, priority, complete toggle)
│   └── Recent Activity & Badges
│       └── Notification + achievement feed
│
├── 📖 COURSES  (courses.html + js/courses.js)
│   ├── Filter Controls
│   │   ├── Category dropdown (All, AI, Web, Programming, etc.)
│   │   ├── Level dropdown (All, Beginner, Intermediate, Advanced)
│   │   └── Search input
│   └── Course Cards Grid
│       └── Course Card
│           ├── Course icon + color accent
│           ├── Title, description, category, level tags
│           ├── Duration, instructor, rating, student count
│           ├── Enrollment status / progress bar
│           └── Enroll / Continue button
│
├── 📖 COURSE DETAIL  (course-detail.html + js/course-detail.js)
│   ├── Course Header (title, description, progress)
│   ├── Module Accordion List
│   │   └── Module → Lesson Items
│   │       ├── Lesson title + duration
│   │       └── Completion checkbox
│   └── Lesson Content Panel
│       ├── Lesson title
│       ├── Markdown-rendered content
│       └── Mark Complete button
│
├── 🤖 AI TUTOR  (ai-assistant.html + js/ai-assistant.js)
│   ├── Quick Prompt Pills (4 suggested topics)
│   └── Chat Interface
│       ├── Chat Messages Container
│       │   ├── User message bubbles
│       │   └── AI response bubbles (markdown-rendered)
│       └── Chat Input Bar
│           ├── Text input
│           └── Send button → POST /chat
│
├── 💻 CODING PRACTICE  (coding-practice.html + js/coding-practice.js)  ← NEW
│   ├── Problem List Sidebar
│   │   └── Problem items (title, difficulty badge)
│   ├── Problem Panel
│   │   ├── Title + difficulty tag
│   │   ├── Description
│   │   ├── Input/Output format
│   │   └── Example cases
│   ├── Code Editor Panel
│   │   ├── Language selector dropdown
│   │   ├── Code textarea (monospace)
│   │   ├── Run button → POST /api/code/run
│   │   └── Submit button → POST /api/submissions
│   ├── Test Results Panel
│   │   ├── Output display
│   │   └── Test case pass/fail indicators
│   └── AI Feedback Panel
│       ├── Detected Issue (short summary)
│       ├── Hint (educational, no direct answer)
│       ├── Concept Explanation
│       ├── Try Again button
│       └── Explain More button → POST /api/ai/feedback
│
├── ⚡ QUIZ CENTER  (quiz.html + js/quiz.js)
│   ├── Quiz Selection List
│   │   └── Quiz cards (title, category, difficulty, time limit)
│   ├── Quiz Engine
│   │   ├── Timer countdown
│   │   ├── Question display
│   │   ├── Answer options (A, B, C, D radio buttons)
│   │   └── Next / Submit buttons
│   └── Results Screen
│       ├── Score + percentage
│       ├── Question-by-question breakdown
│       └── Explanation for each answer
│
├── 📅 STUDY PLANNER  (planner.html + js/planner.js)
│   ├── Task Creation Form (modal)
│   │   ├── Title, Subject, Duration inputs
│   │   ├── Due Date picker
│   │   └── Save button → POST /api/planner
│   ├── Filter Tabs (All / Pending / Completed)
│   └── Task List
│       └── Task Card
│           ├── Title, subject, duration, due date
│           ├── Priority badge
│           ├── Complete toggle
│           └── Delete button
│
├── 📈 ANALYTICS  (analytics.html + js/analytics.js)
│   ├── Stats Overview (4 cards)
│   ├── Weekly Study Hours Chart (HTML5 Canvas bar chart)
│   ├── Course Progress Gauges
│   └── Learning Activity Feed
│
├── 👤 PROFILE  (profile.html + js/profile.js)
│   ├── Profile Edit Form
│   │   ├── Name, bio inputs
│   │   └── Save button → PUT /api/profile
│   ├── Password Change Form
│   │   ├── Current + new password inputs
│   │   └── Update button
│   └── Achievements Gallery
│       └── Achievement Badge (icon, title, description, date)
│
└── 👑 ADMIN PORTAL  (admin.html + js/admin.js)
    ├── Platform Stats Overview
    ├── User Management Table
    │   ├── User list (name, email, role, joined date)
    │   ├── Role toggle button
    │   └── Delete user button
    └── Course Creation Modal
        ├── Title, description, category, level inputs
        └── Create Course button → POST /api/admin/courses
```

---

## Styling Architecture

```text
css/style.css       — Global: CSS variables, reset, typography,
                      buttons, forms, toasts, animations,
                      utility classes, scrollbar, responsive

css/app.css         — App shell: sidebar layout, topbar,
                      stat cards, progress bars, course cards,
                      quiz UI, planner UI, chat UI,
                      code editor, AI feedback panel (new)

css/dashboard.css   — Dashboard: grid layouts, activity feed,
                      quick tools, recent submissions

css/auth.css        — Login/signup: centered card,
                      tab toggle, form fields
```

---

## JavaScript Module Pattern

Each page follows this pattern:

```javascript
// page-name.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;    // Redirect if not logged in
  setupSidebar();              // Populate sidebar with user info
  generateStars(80);           // Background animation
  await loadPageData();        // Fetch from API
  renderUI();                  // Update DOM
});
```

All API calls use the shared `apiCall()` utility which automatically:

1. Reads JWT from localStorage
2. Adds `Authorization: Bearer <token>` header
3. Handles 401/403 → redirects to login
4. Returns parsed JSON
