# AetherLearn AI — REST API Design

> This document describes all REST API endpoints in the AetherLearn AI platform, as discovered through source code inspection. Endpoints are implemented in Node.js/Express.js using JWT authentication.

---

## Base URL

```text
http://localhost:3001
```

## Authentication

Protected endpoints require a valid JWT token in the `Authorization` header:

```text
Authorization: Bearer <token>
```

Tokens are obtained from `/auth/login` or `/auth/signup` and stored in `localStorage`.

**Token Expiry:** 7 days

---

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "Human-readable error message"
}
```

---

## 1. Authentication

### POST `/auth/signup`

Create a new student account.

**Auth Required:** No

**Request Body:**

```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "mypassword123"
}
```

**Success Response (201):**

```json
{
  "message": "Account created!",
  "token": "<jwt_token>",
  "user": {
    "id": "user_1726400000000",
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "role": "student"
  }
}
```

**Errors:**

| Code | Message |
| --- | --- |
| 400 | All fields are required |
| 400 | Password must be at least 6 characters |
| 409 | An account with this email already exists |
| 500 | Signup failed. Please try again |

---

### POST `/auth/login`

Authenticate and receive a JWT token.

**Auth Required:** No

**Request Body:**

```json
{
  "email": "student@demo.com",
  "password": "student123"
}
```

**Success Response (200):**

```json
{
  "message": "Login successful!",
  "token": "<jwt_token>",
  "user": {
    "id": "user_student",
    "name": "Alex Johnson",
    "email": "student@demo.com",
    "role": "student"
  }
}
```

**Errors:**

| Code | Message |
| --- | --- |
| 400 | Email and password are required |
| 401 | Invalid email or password |
| 500 | Login failed. Please try again |

---

## 2. Courses

### GET `/api/courses`

Get all courses with optional filtering.

**Auth Required:** Yes

**Query Parameters:**

| Param | Type | Description |
| --- | --- | --- |
| `category` | String | Filter by category (e.g., `"Programming"`, `"AI/ML"`) |
| `level` | String | Filter by level (`"Beginner"`, `"Intermediate"`, `"Advanced"`) |
| `search` | String | Text search on title and description |

**Success Response (200):**

```json
{
  "success": true,
  "courses": [
    {
      "id": "course_python",
      "title": "Python Programming",
      "description": "...",
      "category": "Programming",
      "level": "Beginner",
      "duration": "24 hours",
      "instructor": "Dr. Sarah Chen",
      "rating": 4.8,
      "students": 3241,
      "color": "#3b82f6",
      "icon": "🐍",
      "student_count": 3241,
      "lesson_count": 16,
      "is_enrolled": 1
    }
  ]
}
```

---

### GET `/api/courses/:id`

Get a single course with its full module/lesson tree and student progress.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "course": {
    "id": "course_python",
    "title": "Python Programming",
    "is_enrolled": true,
    "progress_percentage": 37,
    "completed_lessons": 6,
    "total_lessons": 16,
    "modules": [
      {
        "id": "mod_course_python_0",
        "title": "Getting Started with Python",
        "order_index": 0,
        "lessons": [
          {
            "id": "lesson_mod_course_python_0_0",
            "title": "Introduction & Installation",
            "duration": "8 min",
            "order_index": 0,
            "completed": 1
          }
        ]
      }
    ]
  }
}
```

---

### POST `/api/courses/:id/enroll`

Enroll the current user in a course.

**Auth Required:** Yes

**Success Response (200):**

```json
{ "success": true, "message": "Enrolled successfully" }
```

**Errors:**

| Code | Message |
| --- | --- |
| 400 | Already enrolled in this course |
| 404 | Course not found |

---

## 3. Lessons

### GET `/api/lessons/:id`

Get a single lesson's content.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "lesson": {
    "id": "lesson_mod_course_python_0_0",
    "title": "Introduction & Installation",
    "content": "# Introduction & Installation\n\n...",
    "duration": "8 min"
  }
}
```

### POST `/api/lessons/:id/complete`

Mark a lesson as completed for the current user.

**Auth Required:** Yes

**Success Response (200):**

```json
{ "success": true, "message": "Lesson marked complete" }
```

---

## 4. Quizzes

### GET `/api/quizzes`

Get all available quizzes.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "quizzes": [
    {
      "id": "quiz_python",
      "title": "Python Basics Quiz",
      "category": "Programming",
      "difficulty": "Easy",
      "time_limit": 10,
      "question_count": 5,
      "best_score": 80,
      "attempt_count": 2
    }
  ]
}
```

---

### GET `/api/quizzes/:id`

Get a quiz with all its questions (answers excluded from response for security).

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "quiz": {
    "id": "quiz_python",
    "title": "Python Basics Quiz",
    "time_limit": 10,
    "questions": [
      {
        "id": "q_quiz_python_0",
        "question": "What is the correct way to define a function in Python?",
        "options": ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"],
        "order_index": 0
      }
    ]
  }
}
```

---

### POST `/api/quizzes/:id/attempt`

Submit a quiz attempt and receive graded results.

**Auth Required:** Yes

**Request Body:**

```json
{
  "answers": { "0": 1, "1": 2, "2": 1, "3": 3, "4": 1 }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "score": 4,
  "total": 5,
  "percentage": 80,
  "results": [
    {
      "question": "What is the correct way to define a function in Python?",
      "your_answer": "def myFunc():",
      "correct_answer": "def myFunc():",
      "is_correct": true,
      "explanation": "In Python, functions are defined using the 'def' keyword."
    }
  ]
}
```

---

## 5. Coding Practice (New)

### GET `/api/coding/problems`

Get all available coding practice problems.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "problems": [
    {
      "id": "prob_hello_world",
      "title": "Hello World",
      "difficulty": "Easy",
      "topic": "Basics",
      "supported_languages": ["python", "javascript"]
    }
  ]
}
```

---

### GET `/api/coding/problems/:id`

Get a single problem with full details, examples, and starter code.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "problem": {
    "id": "prob_hello_world",
    "title": "Hello World",
    "description": "Write a program that prints 'Hello, World!' to the output.",
    "difficulty": "Easy",
    "topic": "Basics",
    "input_format": "No input required.",
    "output_format": "Print the string: Hello, World!",
    "examples": [
      { "input": "", "output": "Hello, World!", "explanation": "Simply print the required string." }
    ],
    "starter_code": {
      "python": "# Write your solution here\nprint()",
      "javascript": "// Write your solution here\nconsole.log();"
    },
    "supported_languages": ["python", "javascript"]
  }
}
```

---

### POST `/api/code/run`

Run student code against test cases using a safe mock execution layer.

**Auth Required:** Yes

**Important Note:** This is a **mock execution layer**. Arbitrary code is NOT executed directly on the host. The server validates code structure and returns simulated test results. A real sandboxed execution engine (Docker-isolated) is planned for production.

**Request Body:**

```json
{
  "problem_id": "prob_hello_world",
  "code": "print('Hello, World!')",
  "language": "python"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "output": "Hello, World!",
  "test_results": [
    {
      "test_number": 1,
      "passed": true,
      "input": "",
      "expected": "Hello, World!",
      "actual": "Hello, World!"
    }
  ],
  "all_passed": true,
  "mock": true
}
```

**Errors:**

| Code | Message |
| --- | --- |
| 400 | Code cannot be empty |
| 400 | Unsupported language. Allowed: python, javascript |
| 400 | Code exceeds maximum allowed length |
| 404 | Problem not found |
| 408 | Code execution timed out (simulated) |

---

### POST `/api/submissions`

Save a code submission to the database.

**Auth Required:** Yes

**Request Body:**

```json
{
  "problem_id": "prob_hello_world",
  "code": "print('Hello, World!')",
  "language": "python",
  "status": "passed",
  "output": "Hello, World!",
  "test_results": [{ "passed": true }]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "submission_id": "sub_1726400000000",
  "message": "Submission saved"
}
```

---

### GET `/api/submissions`

Get the current user's submission history.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub_1726400000000",
      "problem_id": "prob_hello_world",
      "problem_title": "Hello World",
      "language": "python",
      "status": "passed",
      "created_at": "2026-09-15T10:30:00.000Z"
    }
  ]
}
```

---

## 6. AI Endpoints

### POST `/api/ai/feedback`

Get AI-powered educational feedback on a code submission.

**Auth Required:** Yes

**Request Body:**

```json
{
  "problem_id": "prob_hello_world",
  "code": "print('hello world')",
  "language": "python",
  "error": null,
  "test_results": [{ "passed": false, "expected": "Hello, World!", "actual": "hello world" }]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "feedback": {
    "detected_issue": "Output capitalization and punctuation do not match the expected format.",
    "hint": "Check the exact spelling and punctuation required. The output must match character-for-character.",
    "concept_explanation": "String literals in Python are output exactly as written. Capitalization matters: 'hello' and 'Hello' are different strings.",
    "suggested_next_step": "Try adjusting your print() statement to match the expected output exactly, including the comma and exclamation mark."
  },
  "mock": false
}
```

**Errors:**

| Code | Message |
| --- | --- |
| 400 | Problem ID and code are required |
| 400 | Code exceeds maximum allowed length |
| 429 | AI rate limit reached. Please try again in a moment |
| 500 | AI service temporarily unavailable |

---

### POST `/summarize`

Summarize study notes into bullet points.

**Auth Required:** Yes

**Request Body:**

```json
{ "text": "Long notes text here..." }
```

**Success Response (200):**

```json
{
  "summary": ["📌 Key point one", "🔑 Key concept two"],
  "mock": false
}
```

---

### POST `/quiz`

Generate MCQ quiz questions from notes.

**Auth Required:** Yes

**Request Body:**

```json
{ "text": "Notes text to generate quiz from..." }
```

**Success Response (200):**

```json
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctIndex": 1,
      "explanation": "Explanation of correct answer"
    }
  ],
  "mock": false
}
```

---

### POST `/chat`

Multi-turn AI tutoring conversation.

**Auth Required:** Yes

**Request Body:**

```json
{
  "message": "Explain Python list comprehensions",
  "history": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "reply": "### Python List Comprehensions\n\n...",
  "mock": false
}
```

---

## 7. Study Planner

### GET `/api/planner`

Get the current user's study tasks.

**Auth Required:** Yes

---

### POST `/api/planner`

Create a new study task.

**Auth Required:** Yes

**Request Body:**

```json
{
  "title": "Complete Python Chapter 2",
  "subject": "Python Programming",
  "duration": 60,
  "due_date": "2026-09-16"
}
```

---

### PATCH `/api/planner/:id`

Toggle task completion status.

**Auth Required:** Yes

---

### DELETE `/api/planner/:id`

Delete a study task.

**Auth Required:** Yes

---

## 8. Analytics

### GET `/api/analytics`

Get learning statistics for the current user.

**Auth Required:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "stats": {
    "total_courses": 3,
    "total_lessons": 16,
    "completed_lessons": 6,
    "total_quizzes": 5,
    "completed_quizzes": 2,
    "average_quiz_score": 90,
    "study_streak": 3,
    "weekly_hours": [1.5, 2.0, 0, 1.0, 3.5, 2.0, 0],
    "course_progress": [
      { "course": "Python Programming", "progress": 37, "color": "#3b82f6" }
    ]
  }
}
```

---

## 9. Profile

### GET `/api/profile`

Get the current user's profile.

**Auth Required:** Yes

---

### PUT `/api/profile`

Update profile name, bio, or password.

**Auth Required:** Yes

**Request Body:**

```json
{
  "name": "Alex Johnson",
  "bio": "Learning Python and AI",
  "currentPassword": "current123",
  "newPassword": "newpassword123"
}
```

---

## 10. Admin (Admin Role Required)

### GET `/api/admin/stats`

Get platform-wide statistics.

**Auth Required:** Yes + Admin role

---

### GET `/api/admin/users`

Get all registered users.

**Auth Required:** Yes + Admin role

---

### PATCH `/api/admin/users/:id/role`

Toggle a user's role between student and admin.

**Auth Required:** Yes + Admin role

---

### DELETE `/api/admin/users/:id`

Delete a user account.

**Auth Required:** Yes + Admin role

---

## General Error Codes

| HTTP Code | Meaning |
| --- | --- |
| 400 | Bad Request — invalid input |
| 401 | Unauthorized — no token or expired token |
| 403 | Forbidden — valid token but wrong role |
| 404 | Not Found — resource does not exist |
| 408 | Request Timeout — operation took too long |
| 409 | Conflict — resource already exists |
| 429 | Too Many Requests — rate limit hit |
| 500 | Internal Server Error — unexpected server error |
