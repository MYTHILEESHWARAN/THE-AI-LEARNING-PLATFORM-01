# AetherLearn AI — AI Interaction Audit

> This document records how AI tools were used during the development and design of the AetherLearn AI platform.
>
> **Important:** This audit distinguishes between what AI suggested and what a human decided and implemented. Records with `[PLACEHOLDER]` indicate areas where the actual history was unavailable and should be filled in with accurate records.

---

## Audit Table

| # | AI Tool | Purpose | Input / Prompt Summary | AI Output Summary | Human Decision | Final Implementation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ChatGPT / Claude | Project ideation | "Design an AI-powered learning platform for CS students" | Suggested features: AI tutor chat, quiz generation, progress tracking, note summarizer | Human selected the most educationally valuable features; rejected gamification-heavy suggestions | Implemented: AI chat, quiz gen, note summarizer, progress tracking |
| 2 | ChatGPT / Claude | UI design direction | "What UI design would work well for a dark-themed educational platform?" | Suggested: glassmorphism, neon accents, space/tech aesthetic, card-based layouts | Human chose dark space + neon palette; decided on Orbitron + Inter fonts | Implemented in `css/style.css` and `css/app.css` |
| 3 | ChatGPT / Claude | System architecture | "What's the simplest full-stack architecture for a learning platform MVP?" | Suggested: Node.js + Express + lightweight DB + OpenAI API | Human chose NeDB for zero-setup, decided against heavy databases for the prototype | Implemented: Node.js + Express + NeDB + OpenAI |
| 4 | ChatGPT / Claude | AI prompt engineering | "How should an AI tutor respond to students?" | Suggested: educational tone, code examples, follow-up questions, step-by-step explanations | Human crafted final system prompts; decided to include markdown + emoji formatting | Implemented in `backend/routes/ai.js` system prompt |
| 5 | ChatGPT / Claude | Code feedback workflow | "Design an AI workflow that teaches, not just answers" | Suggested: Socratic method — detect issue → give hint → explain concept → suggest next step | Human validated this aligned with PBT design-thinking; decided not to reveal full solutions | Implemented in `/api/ai/feedback` with strict system prompt |
| 6 | ChatGPT / Claude | Database schema design | "Design a database schema for an AI learning platform" | Suggested: users, courses, modules, lessons, enrollments, progress, quizzes, submissions | Human adapted schema to NeDB's document model; added composite unique keys for data integrity | Implemented in `backend/database.js` |
| 7 | ChatGPT / Claude | Mock AI responses | "Write educational mock responses for when no OpenAI key is present" | Suggested generic responses for Python, JavaScript, ML topics | Human rewrote responses to be more specific and pedagogically appropriate | Implemented in `getMockChatResponse()`, `getMockSummary()`, `getMockQuiz()` |
| 8 | ChatGPT / Claude | Security review | "What are the security risks of allowing students to submit code?" | Identified: RCE, infinite loops, env var exposure, DoS | Human decided: mock execution layer for now + document full sandbox as planned | Implemented: mock layer + `CODE_EXECUTION_SECURITY.md` |
| 9 | ChatGPT / Claude | Documentation assistance | "Help structure Project Better Tomorrow documentation" | Suggested: PBT pathway, empathy map, user journey, validation framework | Human verified against actual PBT requirements; customized for this platform's context | Implemented: all documentation files |
| 10 | ChatGPT / Claude | Coding problems design | "Design beginner programming problems suitable for a learning platform" | Suggested 10+ problems across difficulty levels with input/output format | Human curated 8 problems appropriate for the platform's audience; verified pedagogical progression | Implemented in `backend/routes/coding.js` seed data |
| 11 | [PLACEHOLDER] | [Add actual AI tool used] | [Add actual prompt/input] | [Add actual AI output] | [Describe human review/decision] | [Describe what was actually implemented] |
| 12 | [PLACEHOLDER] | Debugging assistance | [Add specific bug or error description] | [Add AI-suggested fix] | [Describe what was verified and accepted] | [Describe final code change] |

---

## Categories of AI Usage

### ✅ Brainstorming & Ideation

AI was used to generate a wide range of feature ideas. Humans evaluated these against the Project Better Tomorrow criteria (daily friction, user empathy, practical feasibility) and selected appropriate features.

### ✅ UI/UX Design Assistance

AI suggested visual design directions. The human team made final aesthetic decisions, choosing the dark space/neon glassmorphism theme to align with the platform's technical/educational identity.

### ✅ Architecture Exploration

AI suggested multiple architecture patterns. The human team selected NeDB for its zero-setup advantage (no database server required), making the platform easy to run for student/reviewer demos.

### ✅ Code Generation Assistance

AI helped generate boilerplate code (Express routes, database queries). All AI-generated code was reviewed, tested, and significantly modified before integration.

### ✅ Prompt Engineering

The AI tutor system prompts were iteratively designed with AI assistance, but the core educational philosophy (hints-only, no direct answers) was a human decision based on pedagogical best practices.

### ✅ Documentation Drafting

AI helped structure documentation. All content was reviewed for accuracy against actual source code — no fabricated features or implementations were documented.

---

## Key Human Decisions (Not AI)

These decisions were made by the human development team and NOT primarily influenced by AI suggestions:

1. **Project Better Tomorrow Pathway B** — The decision to frame this as a fresh discovery track focusing on student learning friction was a deliberate human design choice.

2. **Mock execution over fake sandbox** — AI suggested implementing a real sandbox, but the human team decided to be honest: implement a clearly-labelled mock layer and document the real sandbox as planned.

3. **No answer-giving AI** — The instruction to the AI tutor to never give complete solutions was a pedagogical decision based on learning science principles, not AI recommendation.

4. **NeDB over SQLite or MongoDB** — The human team chose NeDB specifically because it requires zero external setup, making the project instantly runnable for reviewers.

5. **No fabricated user research** — Despite AI offering to generate sample user research data, the human team explicitly decided to provide empty templates rather than fabricate results.

---

## How to Update This Document

When AI is used during further development, add a new row to the table with:

- The specific AI tool used (ChatGPT, Claude, Gemini, GitHub Copilot, etc.)
- The exact purpose of using AI
- A summary of the prompt/input given to AI
- What AI actually output (summary, not verbatim)
- The human decision made after reviewing AI output
- What was actually implemented as a result

This audit ensures transparency about AI's role in the development process.

---

*AetherLearn AI — AI Interaction Audit v1.0*
*Last Updated: September 2026*
