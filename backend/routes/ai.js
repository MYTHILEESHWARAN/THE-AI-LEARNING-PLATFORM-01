const express = require('express');
const OpenAI = require('openai');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── OpenAI Client ────────────────────────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Mock Responses (used when no API key) ───────────────────────────────────
function getMockSummary(text) {
  const words = text.split(' ').slice(0, 20).join(' ');
  return [
    `📌 The notes cover key topic: "${words}..."`,
    '📌 Core principles and architectural concepts are outlined for study.',
    '📌 Practical implementations and real-world use cases are highlighted.',
    '📌 Essential terminology and definitions have been categorized.',
    '📌 Recommended next steps: practice coding exercises and review flashcards.',
    '📌 Spaced repetition schedule suggested: review in 24h, 3 days, and 1 week.'
  ];
}

function getMockQuiz(text) {
  return [
    {
      question: 'What is the primary focus of these notes?',
      options: [
        'A) Historical analysis',
        'B) The main topic and concepts described in the text',
        'C) Unrelated trivia',
        'D) Purely mathematical formulas'
      ],
      correctIndex: 1,
      explanation: 'The notes primarily focus on the core educational concepts introduced.'
    },
    {
      question: 'Which learning technique is most effective for mastering this material?',
      options: [
        'A) Passive skimming once',
        'B) Highlighting everything without practice',
        'C) Active recall and spaced repetition',
        'D) Cramming the night before'
      ],
      correctIndex: 2,
      explanation: 'Active recall combined with spaced repetition gives the highest retention.'
    },
    {
      question: 'How should you break down complex modules in this domain?',
      options: [
        'A) Skip the difficult parts entirely',
        'B) Deconstruct into smaller concepts and build hands-on projects',
        'C) Memorize without conceptual understanding',
        'D) Only read theory without coding'
      ],
      correctIndex: 1,
      explanation: 'Deconstructing complex concepts into sub-modules and practical projects ensures mastery.'
    },
    {
      question: 'What is the best way to verify your understanding of this material?',
      options: [
        'A) Re-read the notes once',
        'B) Assume you know it without testing',
        'C) Testing yourself with practice quizzes and practical exercises',
        'D) Highlighting every paragraph'
      ],
      correctIndex: 2,
      explanation: 'Self-testing and quizzes are the most reliable indicators of actual mastery.'
    },
    {
      question: 'When should you review these notes for maximum retention?',
      options: [
        'A) Only once',
        'B) At increasing intervals: 1 day, 3 days, 1 week, 1 month',
        'C) Never after the first read',
        'D) Only during the exam itself'
      ],
      correctIndex: 1,
      explanation: 'Spaced repetition at increasing intervals is scientifically proven for long-term memory.'
    }
  ];
}

function getMockChatResponse(message, history = []) {
  const msg = message.toLowerCase();
  
  if (msg.includes('python') || msg.includes('programming') || msg.includes('code')) {
    return `### Python Learning Tips 🐍\n\nPython is renowned for its readability and powerful ecosystem. Here are key concepts to focus on:\n\n1. **Data Structures**: Lists, Dictionaries, Sets, and Tuples.\n2. **Functional Tools**: List comprehensions, \`map()\`, \`filter()\`, and lambda functions.\n3. **Object-Oriented Programming**: Classes, inheritance, and dunder methods (\`__init__\`, \`__str__\`).\n\n\`\`\`python\n# Example: Clean List Comprehension\nsquares = [x**2 for x in range(10) if x % 2 == 0]\nprint(f"Even squares: {squares}") # [0, 4, 16, 36, 64]\n\`\`\`\n\nWould you like a quiz or an exercise on this?`;
  }
  
  if (msg.includes('react') || msg.includes('javascript') || msg.includes('frontend')) {
    return `### Modern JavaScript & React ⚛️\n\nWhen building modern web applications, keep these core principles in mind:\n\n- **Declarative UI**: Describe how your UI should look for any state.\n- **Hooks**: Use \`useState\` for local state and \`useEffect\` for side effects.\n- **Component Composition**: Build small, reusable, pure components.\n\n\`\`\`javascript\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(c => c + 1)}>\n      Clicked {count} times\n    </button>\n  );\n}\n\`\`\`\n\nWhat specific React or JS topic would you like to explore next?`;
  }

  if (msg.includes('machine learning') || msg.includes('ai') || msg.includes('neural')) {
    return `### AI & Machine Learning Foundations 🤖\n\nMachine learning revolves around learning patterns from data rather than hardcoding rules.\n\n- **Supervised Learning**: Classification (e.g., spam detection) & Regression (e.g., price prediction).\n- **Unsupervised Learning**: Clustering & Dimensionality Reduction.\n- **Neural Networks**: Input layer → Hidden layers (weights + activation) → Output layer.\n- **Loss Optimization**: Gradient Descent minimizing loss functions like Cross-Entropy or MSE.\n\nWould you like to see a practical Python example using PyTorch or Scikit-Learn?`;
  }

  return `### AI Study Assistant 🎓\n\nI'm here to help you master your coursework! Here is how we can accelerate your learning:\n\n- **Explain Concepts**: Ask me to break down any topic with analogies and clear definitions.\n- **Generate Practice Problems**: I can give you coding challenges or quiz questions.\n- **Code Review & Debugging**: Paste your code and I will explain bugs and optimizations.\n- **Study Plan Creation**: Tell me your target exam or project deadline!\n\n*Question asked*: "${message}"\n\nWhat specific aspect of this topic would you like to dive into?`;
}

// ─── POST /summarize ──────────────────────────────────────────────────────────
router.post('/summarize', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide at least 10 characters of notes to summarize.' });
    }

    // Award AI achievement if earned
    if (db && db.achievements) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'ai_scholar',
        user_ach: `${req.user.id}_ai_scholar`,
        earned_at: new Date().toISOString()
      }).catch(() => {});
    }

    if (!openai) {
      const bullets = getMockSummary(text);
      return res.json({ summary: bullets, mock: true });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert study assistant. Summarize the provided notes into clear, concise bullet points. 
          Format: Return ONLY a JSON array of strings, each string being one bullet point summary. 
          Each bullet should start with an emoji relevant to the content.
          Generate 5-8 bullet points. Be specific and extract the key ideas.
          Example format: ["📌 Key point one", "🔑 Key concept two", "💡 Important insight three"]`
        },
        {
          role: 'user',
          content: `Please summarize these notes:\n\n${text.slice(0, 4000)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    const rawContent = completion.choices[0].message.content.trim();
    let bullets;
    try {
      const match = rawContent.match(/\[[\s\S]*\]/);
      bullets = match ? JSON.parse(match[0]) : rawContent.split('\n').filter(l => l.trim());
    } catch {
      bullets = rawContent.split('\n').filter(l => l.trim());
    }

    res.json({ summary: bullets });
  } catch (err) {
    console.error('[SUMMARIZE ERROR]', err.message);
    if (err.status === 429) return res.status(429).json({ error: 'AI rate limit reached. Please try again in a moment.' });
    if (err.status === 401) return res.status(401).json({ error: 'Invalid OpenAI API key. Check your .env file.' });
    res.status(500).json({ error: 'Failed to generate summary. Please try again.' });
  }
});

// ─── POST /quiz ───────────────────────────────────────────────────────────────
router.post('/quiz', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide more text to generate a meaningful quiz.' });
    }

    if (!openai) {
      const questions = getMockQuiz(text);
      return res.json({ questions, mock: true });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert educator. Generate exactly 5 multiple-choice questions from the provided notes.
          Return ONLY valid JSON in this exact format:
          [
            {
              "question": "Question text here?",
              "options": ["A) Option one", "B) Option two", "C) Option three", "D) Option four"],
              "correctIndex": 0,
              "explanation": "Brief explanation of why this is correct."
            }
          ]
          Rules:
          - correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
          - Make questions test genuine understanding, not just memorization
          - Make distractors plausible but clearly wrong
          - Keep questions focused on the most important concepts`
        },
        {
          role: 'user',
          content: `Generate 5 multiple-choice questions from these notes:\n\n${text.slice(0, 4000)}`
        }
      ],
      temperature: 0.6,
      max_tokens: 1200
    });

    const rawContent = completion.choices[0].message.content.trim();
    let questions;
    try {
      const match = rawContent.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    } catch {
      return res.status(500).json({ error: 'Failed to parse quiz response. Please try again.' });
    }

    if (!questions.length) {
      return res.status(500).json({ error: 'Could not generate quiz questions. Please provide more detailed notes.' });
    }

    res.json({ questions });
  } catch (err) {
    console.error('[QUIZ ERROR]', err.message);
    if (err.status === 429) return res.status(429).json({ error: 'AI rate limit reached. Please try again in a moment.' });
    if (err.status === 401) return res.status(401).json({ error: 'Invalid OpenAI API key. Check your .env file.' });
    res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
  }
});

// ─── POST /chat ───────────────────────────────────────────────────────────────
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Award AI achievement
    if (db && db.achievements) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'ai_scholar',
        user_ach: `${req.user.id}_ai_scholar`,
        earned_at: new Date().toISOString()
      }).catch(() => {});
    }

    if (!openai) {
      const reply = getMockChatResponse(message, history);
      return res.json({ success: true, reply, mock: true });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an elite AI Learning Assistant for an online educational platform. Explain complex concepts simply with code snippets, markdown formatting, emojis, and practice questions where appropriate.'
      },
      ...((history || []).slice(-6).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      }))),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const reply = completion.choices[0].message.content.trim();
    res.json({ success: true, reply });
  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    if (err.status === 429) return res.status(429).json({ error: 'AI rate limit reached.' });
    if (err.status === 401) return res.status(401).json({ error: 'Invalid OpenAI API key.' });
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

module.exports = router;
