# AetherLearn AI — Code Execution Security Design

> **Current Status:** This document describes the code execution architecture. The current implementation uses a **safe mock execution layer**. A real sandboxed execution environment is documented here as the planned production architecture.

---

## Why Code Execution Security Matters

When a learning platform allows students to submit code, a naive implementation that directly executes that code on the server creates serious risks:

- **Infinite loops** can freeze the server and deny service to other users
- **File system access** — malicious code could read sensitive files (e.g., `.env`, database files)
- **Network access** — code could make outbound connections, exfiltrate data, or attack other systems
- **Memory exhaustion** — unbounded allocations can crash the server
- **API key exposure** — if environment variables are accessible, secrets can be stolen
- **Remote code execution (RCE)** — in the worst case, an attacker gains shell access to the server

---

## Current Implementation: Safe Mock Execution Layer

**Status: ✅ Implemented (Mock)**

Since a real sandbox requires infrastructure (Docker, VMs, cloud functions) that is not available in this project's current scope, we use a **safe mock execution layer** that:

1. **Accepts** the student's code as input
2. **Validates** it (length, language, content)
3. **Simulates** execution using pre-defined test case mappings
4. **Returns** realistic output without ever executing the code
5. **Labels** all responses with `"mock": true` so the UI can indicate this

This approach allows the full educational workflow (write → run → AI feedback → improve) without any security risk.

```
Student submits code
        │
        ▼
POST /api/code/run
        │
        ▼
┌──────────────────────────────────────┐
│         Input Validation             │
│  1. Language in whitelist?           │
│     Allowed: ["python","javascript"] │
│  2. Code length ≤ MAX_CODE_LENGTH?   │
│     (configurable, default 5000 chars)│
│  3. Code is not empty?               │
└──────────────────────┬───────────────┘
                       │ All checks pass
                       ▼
┌──────────────────────────────────────┐
│       Problem Lookup                 │
│  Load problem from codingProblems DB │
│  Retrieve expected test cases        │
└──────────────────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────┐
│     Mock Execution Logic             │
│  Compare student code patterns       │
│  against expected outputs            │
│  Return: output, test results        │
│  Mark: "mock": true                  │
└──────────────────────────────────────┘
```

---

## Planned Production Architecture: Isolated Sandbox

**Status: 🔵 Planned**

The production-ready code execution system would use process isolation:

```
Student submits code
        │
        ▼
POST /api/code/run (Backend)
        │
        ▼
┌─────────────────────────────────────────────┐
│            Pre-Execution Validation          │
│  • Language whitelist check                 │
│  • Code length limit (e.g., 10KB max)       │
│  • Dangerous pattern detection (OS calls)   │
│  • Anti-abuse: per-user rate limiting       │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│          Isolated Execution Container        │
│                                             │
│  Docker container per execution:            │
│  • No network access (--network=none)       │
│  • Read-only filesystem (--read-only)       │
│  • No access to host env variables          │
│  • CPU limit: 0.5 cores max                 │
│  • Memory limit: 64MB max                   │
│  • Execution timeout: 5 seconds             │
│  • No root privileges (--user=nobody)       │
│  • tmpfs for /tmp only                      │
│                                             │
│  Languages supported:                       │
│  • Python 3 (python:3.11-slim)              │
│  • JavaScript (node:20-slim)                │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│            Result Processing                 │
│  • Capture stdout/stderr                    │
│  • Compare against expected test outputs    │
│  • Generate pass/fail for each test case    │
│  • Destroy container after execution        │
└──────────────────────────────────────────────┘
```

### Planned Docker Run Command Example
```bash
docker run \
  --rm \
  --network=none \
  --read-only \
  --user=nobody \
  --memory=64m \
  --cpus=0.5 \
  --timeout=5 \
  --tmpfs=/tmp:rw,size=10m \
  python:3.11-slim \
  python3 /tmp/solution.py
```

---

## Security Requirements Checklist

### Input Validation
- [x] Language is validated against an explicit whitelist (`["python", "javascript"]`)
- [x] Code length is validated against `MAX_CODE_LENGTH` (environment variable)
- [x] Code cannot be empty
- [x] Problem ID is validated — problem must exist in the database

### Secret Protection
- [x] `OPENAI_API_KEY` is stored in `.env` — never sent to frontend
- [x] `JWT_SECRET` is stored in `.env` — never sent to frontend
- [x] `.env` is in `.gitignore` — never committed to version control
- [x] No secrets are hard-coded in source files
- [x] No secrets are embedded in frontend JavaScript files

### API Security
- [x] All code submission endpoints require valid JWT authentication
- [x] Error messages are user-friendly and do not expose internal details
- [x] No stack traces returned in production error responses
- [x] AI prompts include instruction to avoid returning dangerous code

### Execution Security (Current: Mock)
- [x] Code is NEVER executed directly on the server
- [x] Mock responses are based on problem-defined test cases only
- [ ] Docker isolation — Planned
- [ ] CPU/memory limits — Planned
- [ ] Network isolation — Planned
- [ ] Filesystem restriction — Planned
- [ ] Rate limiting per user — Planned

### AI Safety
- [x] AI prompt instructs: "Do NOT provide the complete solution"
- [x] AI prompt instructs: "Give educational hints only"
- [x] AI output is displayed as-is (not executed)
- [x] AI input (student code) is size-limited before sending to API

---

## Environment Variables for Code Execution

```env
# Maximum allowed code submission size in characters
MAX_CODE_LENGTH=5000

# Maximum execution time in milliseconds (for future sandbox)
CODE_TIMEOUT_MS=5000

# Supported languages (comma-separated)
SUPPORTED_LANGUAGES=python,javascript
```

---

## What the Mock Runner Does NOT Do

To be completely transparent:

| Action | Mock Runner | Production Sandbox (Planned) |
|---|---|---|
| Execute student code | ❌ Never | ✅ Yes (isolated) |
| Evaluate code logic | ❌ Pattern-matching only | ✅ Real output |
| Apply CPU limits | N/A | ✅ Yes |
| Apply memory limits | N/A | ✅ Yes |
| Apply timeout | Simulated | ✅ Yes (hard kill) |
| Isolate filesystem | N/A | ✅ Yes (read-only) |
| Block network | N/A | ✅ Yes (--network=none) |

---

## Educational Justification

The mock execution layer still achieves the primary educational goal:

```
Student writes code
        │
        ▼
Sees realistic output feedback
        │
        ▼
Receives AI-powered educational hints
        │
        ▼
Understands the programming concept
        │
        ▼
Retries with improved understanding
```

The learning workflow is complete even without real code execution, because the value is in the **AI feedback and conceptual understanding**, not in the execution engine itself.

---

*AetherLearn AI — Code Execution Security Design v1.0*
*Status: Mock Implementation Active | Production Sandbox: Planned*
