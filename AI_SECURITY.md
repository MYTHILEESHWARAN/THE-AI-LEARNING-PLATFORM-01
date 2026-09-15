# AetherLearn AI — AI Security Documentation

> This document describes the security measures implemented for AI integration in the AetherLearn AI platform.

---

## AI Provider

- **Provider:** OpenAI
- **Model:** GPT-3.5-turbo
- **API:** OpenAI REST API via official `openai` npm SDK v4.47.1

---

## 1. API Key Security

### Current Implementation

```text
✅ SECURE — API key is stored server-side only
```

**How it works:**

1. `OPENAI_API_KEY` is stored in `backend/.env`
2. Loaded at startup via `dotenv.config()`
3. Used only in `backend/routes/ai.js` (server-side Node.js)
4. **Never** sent to the frontend browser
5. **Never** hard-coded in any source file
6. **Never** visible in any HTTP response

**Verification (check these files):**

- `backend/routes/ai.js` — API key accessed via `process.env.OPENAI_API_KEY` only
- `frontend/js/*.js` — No `OPENAI_API_KEY`, `sk-` prefix, or API credentials of any kind
- `backend/.gitignore` — `.env` is excluded from version control

```javascript
// ✅ Correct — server-side only
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
```

---

## 2. Environment Variable Configuration

### `.env` File (Never committed to Git)

```env
OPENAI_API_KEY=sk-your_actual_key_here
JWT_SECRET=your_jwt_secret_here
PORT=3001
```

### `.env.example` File (Safe to commit — placeholder values only)

```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_change_in_production
PORT=3001
MAX_CODE_LENGTH=5000
CODE_TIMEOUT_MS=5000
```

### Gitignore Rules

```text
.env
*.env
```

---

## 3. Mock Fallback System

When no API key is configured (or the key is the placeholder value), the system automatically uses **mock AI responses**:

```javascript
// From backend/routes/ai.js
let openai = null;
if (process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// In each handler:
if (!openai) {
  return res.json({ reply: getMockChatResponse(message), mock: true });
}
```

This design means:

- The platform works completely without an API key (development mode)
- No errors are thrown if the key is missing
- The UI gracefully falls back to pre-written educational responses
- The `"mock": true` field in responses allows the UI to indicate demo mode

---

## 4. Input Validation

All AI endpoints validate input before making API calls:

### `/chat` Endpoint

```javascript
if (!message || !message.trim()) {
  return res.status(400).json({ error: 'Message cannot be empty' });
}
// Input is sliced to prevent very large payloads
content: `${text.slice(0, 4000)}`
```

### `/summarize` Endpoint

```javascript
if (!text || text.trim().length < 10) {
  return res.status(400).json({ error: 'Please provide at least 10 characters' });
}
content: `${text.slice(0, 4000)}`  // Hard limit on OpenAI input
```

### `/quiz` Endpoint

```javascript
if (!text || text.trim().length < 20) {
  return res.status(400).json({ error: 'Please provide more text' });
}
content: `${text.slice(0, 4000)}`  // Hard limit on OpenAI input
```

### `/api/ai/feedback` Endpoint

```javascript
if (!problem_id || !code) {
  return res.status(400).json({ error: 'Problem ID and code are required' });
}
const maxLen = parseInt(process.env.MAX_CODE_LENGTH) || 5000;
if (code.length > maxLen) {
  return res.status(400).json({ error: 'Code exceeds maximum allowed length' });
}
```

---

## 5. Educational AI Prompting

For the coding feedback endpoint, the AI system prompt explicitly instructs against giving away complete answers:

```javascript
// From backend/routes/coding.js
const systemPrompt = `You are an educational AI tutor for a programming learning platform.
A student has submitted code for a coding problem. Your goal is to help them LEARN, not to solve the problem for them.

STRICT RULES:
1. Do NOT provide the complete solution or working code
2. Identify the specific issue or misconception in their code
3. Give a hint that guides them toward the solution without revealing it
4. Explain the underlying programming concept they need to understand
5. Suggest a specific next step they can take

Return ONLY valid JSON in this exact format:
{
  "detected_issue": "Brief description of what's wrong",
  "hint": "A helpful hint WITHOUT the direct answer",
  "concept_explanation": "The programming concept they need to understand",
  "suggested_next_step": "Specific action they should take next"
}`;
```

---

## 6. Error Handling

All AI errors are caught and returned as safe, user-friendly messages:

```javascript
// API-specific errors
if (err.status === 429) {
  return res.status(429).json({ error: 'AI rate limit reached. Please try again in a moment.' });
}
if (err.status === 401) {
  return res.status(401).json({ error: 'Invalid OpenAI API key. Check your .env file.' });
}

// Generic error — no internal details exposed
res.status(500).json({ error: 'Failed to generate AI response. Please try again.' });
```

**What users never see:**

- Internal stack traces
- API key values
- OpenAI error codes
- Database connection details
- Server infrastructure information

---

## 7. Authentication for AI Endpoints

All AI endpoints require valid JWT authentication:

```javascript
router.post('/chat', verifyToken, async (req, res) => { ... });
router.post('/summarize', verifyToken, async (req, res) => { ... });
router.post('/quiz', verifyToken, async (req, res) => { ... });
router.post('/api/ai/feedback', verifyToken, async (req, res) => { ... });
```

This prevents:

- Anonymous/unauthenticated use of AI resources
- API key abuse by non-registered users

---

## 8. AI Output Trust

The platform treats AI output as **educational text content only**:

- AI responses are displayed as formatted text/markdown in the UI
- AI output is **never** executed as code
- AI output is **never** used to make database changes
- AI output is **never** fed back into subsequent queries without human review

---

## 9. Security Checklist

| Requirement | Status |
| --- | --- |
| API key stored in server-side `.env` | ✅ Implemented |
| API key never hard-coded | ✅ Implemented |
| API key never sent to frontend | ✅ Implemented |
| `.env` excluded from git | ✅ Implemented |
| `.env.example` with placeholders committed | ✅ Implemented |
| All AI endpoints require JWT auth | ✅ Implemented |
| Input size limited before AI call | ✅ Implemented |
| Empty input rejected before AI call | ✅ Implemented |
| AI errors return user-friendly messages | ✅ Implemented |
| No stack traces exposed | ✅ Implemented |
| Mock fallback when no API key | ✅ Implemented |
| AI instructed not to provide direct answers | ✅ Implemented (code feedback) |
| Rate limiting | 🔵 Planned |
| OpenAI usage monitoring / alerts | 🔵 Planned |
| Per-user AI request quotas | 🔵 Planned |

---

## 10. Future Security Enhancements (Planned)

| Enhancement | Description |
| --- | --- |
| Rate Limiting | `express-rate-limit` to prevent AI endpoint abuse |
| Per-User Quotas | Limit AI calls per user per day |
| Request Logging | Log all AI requests for monitoring (without storing code) |
| Content Filtering | Pre-screen inputs for policy violations |
| Usage Dashboard | Admin view of AI API consumption |
| Key Rotation | Process for rotating API keys without downtime |

---

AetherLearn AI — AI Security Documentation v1.0
