/* ═══════════════════════════════════════════════════════════════
   routes/coding.js — Coding Practice API
   Endpoints: problems list, problem detail, run (mock), submit, AI feedback
   
   SECURITY NOTE: Code is NEVER executed directly.
   A safe mock execution layer is used. Real sandbox is planned.
═══════════════════════════════════════════════════════════════ */
const express = require('express');
const OpenAI = require('openai');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── OpenAI Client (reuse if available) ───────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = ['python', 'javascript'];
const MAX_CODE_LENGTH = parseInt(process.env.MAX_CODE_LENGTH) || 5000;

// ─── Mock AI Feedback (when no API key) ───────────────────────────────────────
function getMockFeedback(code, language, testResults, problem) {
  const allPassed = testResults.every(t => t.passed);

  if (allPassed) {
    return {
      detected_issue: null,
      hint: null,
      concept_explanation: `Great work! Your ${language} solution correctly implements the required logic. You've successfully applied the concept of "${problem.concept || 'programming fundamentals'}".`,
      suggested_next_step: 'Try the next problem to continue building your skills, or explore edge cases in your current solution.'
    };
  }

  // Provide educational feedback based on common patterns
  const codeLC = code.toLowerCase();
  if (!codeLC.includes('print') && !codeLC.includes('console.log') && !codeLC.includes('return')) {
    return {
      detected_issue: 'Your code does not appear to produce any output.',
      hint: 'Check whether your solution actually outputs the required result. Make sure you are using the correct output method for your chosen language.',
      concept_explanation: `In ${language}, you need to explicitly output results. In Python, use print(). In JavaScript, use console.log() or return a value.`,
      suggested_next_step: 'Add an output statement and check that it matches the expected output format exactly.'
    };
  }

  return {
    detected_issue: 'Your solution does not match the expected output for one or more test cases.',
    hint: 'Compare your output carefully with the expected output shown in the test results. Look for differences in spacing, capitalization, or data types.',
    concept_explanation: `The problem requires a specific output format. In programming, "Hello, World!" and "hello world" are completely different strings. Check every character in your output.`,
    suggested_next_step: `Review the problem description and examples again. Focus on the exact output format required. Make small changes and run again to see which tests improve.`
  };
}

// ─── Mock Code Execution ──────────────────────────────────────────────────────
// IMPORTANT: This does NOT execute student code.
// It simulates execution by pattern-matching student code against expected outputs.
// A real sandbox (Docker) is planned for production.
function mockExecuteCode(code, language, problem) {
  const testResults = [];
  let allPassed = true;

  for (const testCase of (problem.test_cases || [])) {
    const expected = testCase.expected_output.trim();
    let passed = false;
    let actual = '';

    // Safe pattern check: does the code reference the expected output?
    const codeContent = code.toLowerCase();
    const expectedLC = expected.toLowerCase();

    // Basic heuristic: check if the code contains key elements of the expected output
    if (language === 'python') {
      // Check for print statement with expected content
      const printMatch = code.match(/print\s*\(\s*['"](.*?)['"]\s*\)/i);
      if (printMatch) {
        actual = printMatch[1];
        passed = actual.trim() === expected.trim();
      } else if (codeContent.includes(expectedLC) || codeContent.includes(expected)) {
        passed = true;
        actual = expected;
      }
    } else if (language === 'javascript') {
      // Check for console.log with expected content
      const logMatch = code.match(/console\.log\s*\(\s*['"](.*?)['"]\s*\)/i);
      if (logMatch) {
        actual = logMatch[1];
        passed = actual.trim() === expected.trim();
      } else if (codeContent.includes(expectedLC) || codeContent.includes(expected)) {
        passed = true;
        actual = expected;
      }
    }

    if (!passed) allPassed = false;

    testResults.push({
      test_number: testResults.length + 1,
      input: testCase.input || '(none)',
      expected: expected,
      actual: passed ? expected : actual || '(no output detected)',
      passed
    });
  }

  // Generate a simple output string
  const output = allPassed
    ? (problem.test_cases[0]?.expected_output || 'OK')
    : 'Output did not match expected results';

  return { output, testResults, allPassed };
}

// ─── GET /api/coding/problems ─────────────────────────────────────────────────
router.get('/problems', verifyToken, async (req, res) => {
  try {
    const problems = await db.codingProblems.find({}).sort({ order_index: 1 });
    const simplified = problems.map(p => ({
      id: p._id,
      title: p.title,
      difficulty: p.difficulty,
      topic: p.topic,
      supported_languages: p.supported_languages,
      concept: p.concept
    }));
    res.json({ success: true, problems: simplified });
  } catch (err) {
    console.error('[CODING PROBLEMS ERROR]', err.message);
    res.status(500).json({ error: 'Failed to load coding problems' });
  }
});

// ─── GET /api/coding/problems/:id ─────────────────────────────────────────────
router.get('/problems/:id', verifyToken, async (req, res) => {
  try {
    const problem = await db.codingProblems.findOne({ _id: req.params.id });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Don't return test case expected outputs to prevent cheating
    const safeProblem = {
      id: problem._id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      topic: problem.topic,
      concept: problem.concept,
      input_format: problem.input_format,
      output_format: problem.output_format,
      examples: problem.examples,
      starter_code: problem.starter_code,
      supported_languages: problem.supported_languages,
      hints: problem.hints ? [problem.hints[0]] : [] // Only reveal first hint initially
    };

    res.json({ success: true, problem: safeProblem });
  } catch (err) {
    console.error('[PROBLEM DETAIL ERROR]', err.message);
    res.status(500).json({ error: 'Failed to load problem' });
  }
});

// ─── POST /api/code/run ───────────────────────────────────────────────────────
// SAFE MOCK EXECUTION — Code is NOT executed on the server
router.post('/run', verifyToken, async (req, res) => {
  try {
    const { problem_id, code, language } = req.body;

    // Input validation
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code cannot be empty.' });
    }
    if (!language || !SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
      return res.status(400).json({
        error: `Unsupported language. Allowed: ${SUPPORTED_LANGUAGES.join(', ')}`
      });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        error: `Code exceeds maximum allowed length (${MAX_CODE_LENGTH} characters).`
      });
    }
    if (!problem_id) {
      return res.status(400).json({ error: 'Problem ID is required.' });
    }

    const problem = await db.codingProblems.findOne({ _id: problem_id });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    // Safe mock execution
    const { output, testResults, allPassed } = mockExecuteCode(code, language.toLowerCase(), problem);

    res.json({
      success: true,
      output,
      test_results: testResults,
      all_passed: allPassed,
      mock: true,
      mock_note: 'Demo mode: Code is not executed. Results are simulated for learning purposes.'
    });
  } catch (err) {
    console.error('[CODE RUN ERROR]', err.message);
    res.status(500).json({ error: 'Failed to run code. Please try again.' });
  }
});

// ─── POST /api/submissions ────────────────────────────────────────────────────
router.post('/submissions', verifyToken, async (req, res) => {
  try {
    const { problem_id, code, language, status, output, test_results } = req.body;

    if (!problem_id || !code || !language) {
      return res.status(400).json({ error: 'Problem ID, code, and language are required.' });
    }
    if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language.' });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: 'Code exceeds maximum allowed length.' });
    }

    const problem = await db.codingProblems.findOne({ _id: problem_id });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    const submissionId = `sub_${Date.now()}_${req.user.id.slice(-6)}`;
    const submission = await db.codeSubmissions.insert({
      _id: submissionId,
      user_id: req.user.id,
      problem_id,
      problem_title: problem.title,
      code: code.slice(0, MAX_CODE_LENGTH),
      language: language.toLowerCase(),
      status: status || 'submitted',
      output: output || '',
      test_results: test_results || [],
      ai_feedback: null,
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      submission_id: submissionId,
      message: 'Submission saved successfully'
    });
  } catch (err) {
    console.error('[SUBMISSION ERROR]', err.message);
    res.status(500).json({ error: 'Failed to save submission. Please try again.' });
  }
});

// ─── GET /api/submissions ─────────────────────────────────────────────────────
router.get('/submissions', verifyToken, async (req, res) => {
  try {
    const submissions = await db.codeSubmissions
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 });

    const simplified = submissions.map(s => ({
      id: s._id,
      problem_id: s.problem_id,
      problem_title: s.problem_title,
      language: s.language,
      status: s.status,
      created_at: s.created_at
    }));

    res.json({ success: true, submissions: simplified });
  } catch (err) {
    console.error('[GET SUBMISSIONS ERROR]', err.message);
    res.status(500).json({ error: 'Failed to load submissions.' });
  }
});

// ─── POST /api/ai/feedback ────────────────────────────────────────────────────
// Educational AI feedback — provides HINTS, not direct solutions
router.post('/feedback', verifyToken, async (req, res) => {
  try {
    const { problem_id, code, language, test_results, error: execError } = req.body;

    // Input validation
    if (!problem_id || !code) {
      return res.status(400).json({ error: 'Problem ID and code are required.' });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: 'Code exceeds maximum allowed length.' });
    }

    const problem = await db.codingProblems.findOne({ _id: problem_id });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    // Use mock feedback if no OpenAI key
    if (!openai) {
      const mockFb = getMockFeedback(code, language || 'python', test_results || [], problem);
      return res.json({ success: true, feedback: mockFb, mock: true });
    }

    // Prepare AI prompt — strictly educational, no direct answers
    const testSummary = (test_results || [])
      .map(t => `Test ${t.test_number}: ${t.passed ? 'PASSED' : 'FAILED'} | Expected: "${t.expected}" | Got: "${t.actual || 'no output'}"`)
      .join('\n');

    const systemPrompt = `You are an educational AI tutor for a programming learning platform.
A student has submitted code for a coding problem. Your goal is to help them LEARN, not to solve the problem for them.

STRICT RULES:
1. Do NOT provide the complete solution or working code
2. Identify the specific issue or misconception in their code
3. Give a hint that guides them toward the solution WITHOUT revealing it
4. Explain the underlying programming concept they need to understand
5. Suggest a specific next step they can take

Return ONLY valid JSON with this exact structure:
{
  "detected_issue": "One-sentence description of what went wrong",
  "hint": "A helpful guiding hint WITHOUT the direct answer (1-2 sentences)",
  "concept_explanation": "Brief explanation of the programming concept they need (2-3 sentences)",
  "suggested_next_step": "Specific actionable step they should take next (1-2 sentences)"
}`;

    const userPrompt = `Problem: "${problem.title}"
Description: ${problem.description}
Expected concept: ${problem.concept || 'programming fundamentals'}

Student's ${language || 'python'} code:
\`\`\`
${code.slice(0, 2000)}
\`\`\`

Test results:
${testSummary || 'No test results available'}

${execError ? `Error: ${execError}` : ''}

Provide educational feedback to help the student understand and fix their code without giving them the answer.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    const rawContent = completion.choices[0].message.content.trim();
    let feedback;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        detected_issue: 'Could not analyze your code.',
        hint: 'Review your code against the problem description.',
        concept_explanation: 'Check the examples in the problem for guidance.',
        suggested_next_step: 'Try running your code and comparing the output with the expected result.'
      };
    } catch {
      feedback = {
        detected_issue: 'Could not analyze your code.',
        hint: 'Review your code against the problem description carefully.',
        concept_explanation: problem.concept || 'Review the programming concept in this problem.',
        suggested_next_step: 'Compare your output with the expected output shown in the examples.'
      };
    }

    res.json({ success: true, feedback });
  } catch (err) {
    console.error('[AI FEEDBACK ERROR]', err.message);
    if (err.status === 429) return res.status(429).json({ error: 'AI rate limit reached. Please try again in a moment.' });
    if (err.status === 401) return res.status(401).json({ error: 'AI service configuration error.' });
    res.status(500).json({ error: 'AI feedback temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
