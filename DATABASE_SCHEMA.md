# AetherLearn AI — Database Schema

> **Technology:** NeDB (via `nedb-promises`) — an embedded, file-based document store.
> No external database server is required. All data is stored in JSON files under `backend/data/`.
>
> NeDB uses a document model similar to MongoDB. Each record is a JSON object. The `_id` field is the unique identifier (auto-generated or manually set).

---

## Collections Overview

| Collection | File | Description |
| --- | --- | --- |
| `users` | `data/users.db` | Registered student and admin accounts |
| `courses` | `data/courses.db` | Course catalog with metadata |
| `modules` | `data/modules.db` | Chapters/modules within each course |
| `lessons` | `data/lessons.db` | Individual lesson content within modules |
| `enrollments` | `data/enrollments.db` | Which students are enrolled in which courses |
| `lessonProgress` | `data/progress.db` | Which lessons a student has completed |
| `quizzes` | `data/quizzes.db` | Quiz definitions |
| `questions` | `data/questions.db` | MCQ questions belonging to a quiz |
| `quizAttempts` | `data/attempts.db` | Student quiz submission history |
| `studyTasks` | `data/tasks.db` | Study planner tasks per user |
| `achievements` | `data/achievements.db` | Unlocked achievement badges |
| `notifications` | `data/notifications.db` | In-app notification messages |
| `codingProblems` | `data/coding_problems.db` | Coding practice problems |
| `codeSubmissions` | `data/code_submissions.db` | Student code submissions |

---

## Schema Definitions

### `users`

```json
{
  "_id": "user_student",
  "name": "Alex Johnson",
  "email": "student@demo.com",
  "password": "<bcrypt_hash>",
  "role": "student",
  "bio": "Passionate about technology and lifelong learning.",
  "avatar": null,
  "created_at": "2026-09-15T00:00:00.000Z",
  "last_login": "2026-09-15T10:30:00.000Z"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique user ID (format: `user_<timestamp>`) |
| `name` | String | Full name |
| `email` | String | Unique email address (lowercase, indexed) |
| `password` | String | bcrypt-hashed password (12 salt rounds) |
| `role` | String | `"student"` or `"admin"` |
| `bio` | String | Optional profile biography |
| `avatar` | String\|null | Base64 avatar image or null |
| `created_at` | ISO String | Account creation timestamp |
| `last_login` | ISO String\|null | Last successful login timestamp |

**Indexes:** `email` (unique)

---

### `courses`

```json
{
  "_id": "course_python",
  "title": "Python Programming",
  "description": "Master Python from basics to advanced OOP...",
  "category": "Programming",
  "level": "Beginner",
  "duration": "24 hours",
  "instructor": "Dr. Sarah Chen",
  "rating": 4.8,
  "students": 3241,
  "color": "#3b82f6",
  "icon": "🐍"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique course ID (e.g., `course_python`) |
| `title` | String | Course name |
| `description` | String | Full course description |
| `category` | String | e.g., Programming, AI/ML, Web, Security, Database |
| `level` | String | `"Beginner"`, `"Intermediate"`, or `"Advanced"` |
| `duration` | String | Estimated time (e.g., `"24 hours"`) |
| `instructor` | String | Instructor name |
| `rating` | Number | Average rating (0–5) |
| `students` | Number | Enrolled student count |
| `color` | String | Hex color for UI accent |
| `icon` | String | Emoji icon |

---

### `modules`

```json
{
  "_id": "mod_course_python_0",
  "course_id": "course_python",
  "title": "Getting Started with Python",
  "order_index": 0
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique module ID |
| `course_id` | String | FK → `courses._id` |
| `title` | String | Module/chapter title |
| `order_index` | Number | Display ordering (0-based) |

**Relationship:** Module belongs to one Course. Course has many Modules.

---

### `lessons`

```json
{
  "_id": "lesson_mod_course_python_0_0",
  "module_id": "mod_course_python_0",
  "course_id": "course_python",
  "title": "Introduction & Installation",
  "content": "# Introduction & Installation\n\n...(markdown)...",
  "duration": "8 min",
  "order_index": 0
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique lesson ID |
| `module_id` | String | FK → `modules._id` |
| `course_id` | String | FK → `courses._id` (denormalized for query performance) |
| `title` | String | Lesson title |
| `content` | String | Lesson body in Markdown format |
| `duration` | String | Estimated reading time (e.g., `"8 min"`) |
| `order_index` | Number | Ordering within module |

**Relationship:** Lesson belongs to one Module and one Course.

---

### `enrollments`

```json
{
  "_id": "enroll_1",
  "user_id": "user_student",
  "course_id": "course_python",
  "user_course": "user_student_course_python",
  "enrolled_at": "2026-09-15T00:00:00.000Z",
  "progress_percentage": 0
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique enrollment ID |
| `user_id` | String | FK → `users._id` |
| `course_id` | String | FK → `courses._id` |
| `user_course` | String | Composite key `{user_id}_{course_id}` (unique) |
| `enrolled_at` | ISO String | Enrollment timestamp |
| `progress_percentage` | Number | Calculated completion percentage |

**Indexes:** `user_course` (unique — prevents duplicate enrollments)

---

### `lessonProgress`

```json
{
  "_id": "prog_0",
  "user_id": "user_student",
  "lesson_id": "lesson_mod_course_python_0_0",
  "course_id": "course_python",
  "completed_at": "2026-09-15T00:00:00.000Z",
  "user_lesson": "user_student_lesson_mod_course_python_0_0"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique progress record ID |
| `user_id` | String | FK → `users._id` |
| `lesson_id` | String | FK → `lessons._id` |
| `course_id` | String | FK → `courses._id` (denormalized) |
| `completed_at` | ISO String | Lesson completion timestamp |
| `user_lesson` | String | Composite key (unique — prevents duplicate completions) |

**Indexes:** `user_lesson` (unique)

---

### `quizzes`

```json
{
  "_id": "quiz_python",
  "title": "Python Basics Quiz",
  "description": "Test your Python fundamentals",
  "category": "Programming",
  "difficulty": "Easy",
  "time_limit": 10,
  "course_id": "course_python"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique quiz ID |
| `title` | String | Quiz display name |
| `description` | String | Short description |
| `category` | String | Subject category |
| `difficulty` | String | `"Easy"`, `"Medium"`, or `"Hard"` |
| `time_limit` | Number | Time in minutes |
| `course_id` | String | FK → `courses._id` |

---

### `questions`

```json
{
  "_id": "q_quiz_python_0",
  "quiz_id": "quiz_python",
  "question": "What is the correct way to define a function in Python?",
  "options": ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"],
  "correct_index": 1,
  "explanation": "In Python, functions are defined using the 'def' keyword.",
  "order_index": 0
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique question ID |
| `quiz_id` | String | FK → `quizzes._id` |
| `question` | String | Question text |
| `options` | String[] | Array of 4 answer choices |
| `correct_index` | Number | 0-based index of the correct answer |
| `explanation` | String | Why this answer is correct |
| `order_index` | Number | Display ordering |

---

### `quizAttempts`

```json
{
  "_id": "attempt_1",
  "user_id": "user_student",
  "quiz_id": "quiz_python",
  "score": 4,
  "total": 5,
  "percentage": 80,
  "answers": { "0": 1, "1": 2, "2": 1 },
  "attempted_at": "2026-09-13T00:00:00.000Z"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique attempt ID |
| `user_id` | String | FK → `users._id` |
| `quiz_id` | String | FK → `quizzes._id` |
| `score` | Number | Number of correct answers |
| `total` | Number | Total questions in quiz |
| `percentage` | Number | Score as percentage (0–100) |
| `answers` | Object | Map of question index → chosen answer index |
| `attempted_at` | ISO String | Attempt timestamp |

---

### `studyTasks`

```json
{
  "_id": "task_1",
  "user_id": "user_student",
  "title": "Complete Python Chapter 2",
  "subject": "Python Programming",
  "duration": 60,
  "due_date": "2026-09-16",
  "completed": false,
  "completed_at": null,
  "created_at": "2026-09-15T00:00:00.000Z"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique task ID |
| `user_id` | String | FK → `users._id` |
| `title` | String | Task description |
| `subject` | String | Related subject/course |
| `duration` | Number | Estimated minutes |
| `due_date` | String | ISO date string (`YYYY-MM-DD`) |
| `completed` | Boolean | Completion status |
| `completed_at` | ISO String\|null | Completion timestamp |
| `created_at` | ISO String | Creation timestamp |

---

### `achievements`

```json
{
  "_id": "ach_1",
  "user_id": "user_student",
  "achievement_id": "first_login",
  "title": "Welcome Aboard",
  "description": "Created your account",
  "icon": "🎉",
  "earned_at": "2026-09-15T00:00:00.000Z",
  "user_ach": "user_student_first_login"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique achievement record ID |
| `user_id` | String | FK → `users._id` |
| `achievement_id` | String | Achievement type identifier |
| `title` | String | Display title |
| `description` | String | Achievement description |
| `icon` | String | Emoji icon |
| `earned_at` | ISO String | When it was earned |
| `user_ach` | String | Composite key `{user_id}_{achievement_id}` (unique) |

**Indexes:** `user_ach` (unique — prevents duplicate awards)

---

### `notifications`

```json
{
  "_id": "notif_1",
  "user_id": "user_student",
  "title": "Welcome to Learning Platform! 🎉",
  "message": "Start your journey by exploring our courses.",
  "type": "info",
  "read": false,
  "created_at": "2026-09-15T00:00:00.000Z"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique notification ID |
| `user_id` | String | FK → `users._id` |
| `title` | String | Notification headline |
| `message` | String | Full notification body |
| `type` | String | `"info"`, `"success"`, `"warning"`, `"course"` |
| `read` | Boolean | Whether user has seen it |
| `created_at` | ISO String | Notification timestamp |

---

### `codingProblems` *(New)*

```json
{
  "_id": "prob_hello_world",
  "title": "Hello World",
  "description": "Write a program that prints 'Hello, World!' to the output.",
  "difficulty": "Easy",
  "topic": "Basics",
  "input_format": "No input required.",
  "output_format": "Print the string: Hello, World!",
  "examples": [
    { "input": "", "output": "Hello, World!", "explanation": "Simply print the required string." }
  ],
  "test_cases": [
    { "input": "", "expected_output": "Hello, World!" }
  ],
  "supported_languages": ["python", "javascript"],
  "starter_code": {
    "python": "# Write your solution here\nprint()",
    "javascript": "// Write your solution here\nconsole.log();"
  },
  "hints": ["Use the print() function in Python", "Use console.log() in JavaScript"],
  "concept": "Output / Print statements",
  "order_index": 1
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique problem ID |
| `title` | String | Problem name |
| `description` | String | Full problem statement |
| `difficulty` | String | `"Easy"`, `"Medium"`, or `"Hard"` |
| `topic` | String | Programming concept (Basics, Loops, Arrays, etc.) |
| `input_format` | String | How input is structured |
| `output_format` | String | Expected output format |
| `examples` | Object[] | Worked examples with input/output/explanation |
| `test_cases` | Object[] | Test cases for validation |
| `supported_languages` | String[] | Allowed submission languages |
| `starter_code` | Object | Language-keyed starter code templates |
| `hints` | String[] | Ordered hints (revealed progressively) |
| `concept` | String | Core programming concept being taught |
| `order_index` | Number | Display ordering |

---

### `codeSubmissions` *(New)*

```json
{
  "_id": "sub_1726400000000",
  "user_id": "user_student",
  "problem_id": "prob_hello_world",
  "code": "print('Hello, World!')",
  "language": "python",
  "status": "passed",
  "output": "Hello, World!",
  "test_results": [{ "passed": true, "input": "", "expected": "Hello, World!", "actual": "Hello, World!" }],
  "ai_feedback": {
    "detected_issue": null,
    "hint": null,
    "concept_explanation": "Your solution correctly uses the print() function...",
    "suggested_next_step": "Try the next problem on variables and data types."
  },
  "created_at": "2026-09-15T10:30:00.000Z"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `_id` | String | Unique submission ID |
| `user_id` | String | FK → `users._id` |
| `problem_id` | String | FK → `codingProblems._id` |
| `code` | String | Student's submitted code |
| `language` | String | `"python"` or `"javascript"` |
| `status` | String | `"passed"`, `"failed"`, `"error"` |
| `output` | String | Mock execution output |
| `test_results` | Object[] | Per-test-case pass/fail results |
| `ai_feedback` | Object | AI-generated educational feedback |
| `ai_feedback.detected_issue` | String\|null | What went wrong (if applicable) |
| `ai_feedback.hint` | String\|null | Guided hint without revealing answer |
| `ai_feedback.concept_explanation` | String | Educational concept explanation |
| `ai_feedback.suggested_next_step` | String | What to try or study next |
| `created_at` | ISO String | Submission timestamp |

---

## Entity Relationship Summary

```text
users ─────────────────────────────────────────────┐
  │                                                │
  ├── enrollments (user_id) ──── courses           │
  │                                                │
  ├── lessonProgress (user_id) ─ lessons           │
  │                                 └── modules ── courses
  │                                                │
  ├── quizAttempts (user_id) ──── quizzes          │
  │                                 └── questions  │
  │                                                │
  ├── studyTasks (user_id)                         │
  ├── achievements (user_id)                       │
  ├── notifications (user_id)                      │
  └── codeSubmissions (user_id) ─ codingProblems   │
                                                   │
                                            [all independent]
```

---

## Notes

- **NeDB** uses a flat-file store. All "joins" are handled in application code (not SQL JOINs).
- **Denormalization** is used intentionally (e.g., `course_id` on `lessons`) to avoid expensive multi-collection lookups.
- **Unique indexes** are enforced to prevent duplicate enrollments, lesson completions, and achievements.
- **Seeding** occurs on first startup via `seedData()` in `database.js`.
- For a production system, migration to PostgreSQL or MongoDB Atlas is recommended and documented as **Planned**.
