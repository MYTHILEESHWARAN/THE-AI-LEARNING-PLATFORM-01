/* ═══════════════════════════════════════════════════════════════
   coding-practice.js — Coding Practice Page Logic
   Handles: problem loading, code editing, mock run, submission,
            AI feedback, history, hints
═══════════════════════════════════════════════════════════════ */

// ─── State ─────────────────────────────────────────────────────
let currentProblem = null;
let currentHintIndex = 0;
let lastRunResults = null;
let problems = [];

// ─── Initialise ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;
  setupSidebar();
  generateStars(60);

  // Show admin link if admin
  const user = getUser();
  const adminLink = document.getElementById('nav-admin-link');
  if (adminLink && user.role === 'admin') adminLink.style.display = 'flex';

  await loadProblems();
  await loadSubmissionHistory();

  // Handle Tab key in textarea for proper indentation
  const editor = document.getElementById('code-editor');
  if (editor) {
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });
  }
});

// ─── Load Problem List ─────────────────────────────────────────
async function loadProblems() {
  try {
    const data = await apiCall('/api/coding/problems');
    problems = data.problems || [];
    renderProblemList(problems);
  } catch (err) {
    document.getElementById('problem-list').innerHTML =
      `<div style="padding:20px;color:var(--error);font-size:13px;">Failed to load problems. Please refresh.</div>`;
  }
}

function renderProblemList(problemList) {
  const container = document.getElementById('problem-list');
  if (!problemList.length) {
    container.innerHTML = `<div style="padding:20px;color:var(--text-muted);font-size:13px;text-align:center;">No problems available.</div>`;
    return;
  }

  container.innerHTML = problemList.map(p => `
    <div class="problem-item" id="prob-item-${p.id}" onclick="selectProblem('${p.id}')">
      <span class="problem-item-title">${escapeHtml(p.title)}</span>
      <span class="diff-badge diff-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
    </div>
  `).join('');
}

// ─── Select Problem ────────────────────────────────────────────
async function selectProblem(problemId) {
  try {
    // Update active state in list
    document.querySelectorAll('.problem-item').forEach(el => el.classList.remove('active'));
    const listItem = document.getElementById(`prob-item-${problemId}`);
    if (listItem) listItem.classList.add('active');

    const data = await apiCall(`/api/coding/problems/${problemId}`);
    currentProblem = data.problem;
    currentHintIndex = 0;
    lastRunResults = null;

    renderProblemDescription(currentProblem);
    loadStarterCode();
    enableEditor();
    resetResultsPanel();
    resetFeedbackPanel();

  } catch (err) {
    showToast('Failed to load problem: ' + err.message, 'error');
  }
}

// ─── Render Problem Description ────────────────────────────────
function renderProblemDescription(problem) {
  const panel = document.getElementById('problem-description-panel');

  const examplesHTML = (problem.examples || []).map((ex, i) => `
    <div class="example-box">
      <div class="example-label">Example ${i + 1}</div>
      ${ex.input ? `<div><strong style="color:var(--text-muted);font-size:12px;">Input:</strong> <span>${escapeHtml(ex.input)}</span></div>` : ''}
      <div><strong style="color:var(--text-muted);font-size:12px;">Output:</strong> <span style="color:var(--neon-green);">${escapeHtml(ex.output)}</span></div>
      ${ex.explanation ? `<div style="margin-top:6px;color:var(--text-muted);font-size:12px;">💡 ${escapeHtml(ex.explanation)}</div>` : ''}
    </div>
  `).join('');

  panel.innerHTML = `
    <div class="problem-title-row">
      <span class="problem-title">${escapeHtml(problem.title)}</span>
      <span class="diff-badge diff-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
      <span style="font-size:11px;color:var(--text-muted);background:rgba(255,255,255,0.05);padding:3px 8px;border-radius:99px;">${escapeHtml(problem.topic)}</span>
    </div>
    <div class="problem-body">
      <p>${escapeHtml(problem.description)}</p>
      <div class="problem-section-label">Input Format</div>
      <p>${escapeHtml(problem.input_format)}</p>
      <div class="problem-section-label">Output Format</div>
      <p>${escapeHtml(problem.output_format)}</p>
      <div class="problem-section-label">Examples</div>
      ${examplesHTML}
      ${problem.concept ? `
      <div class="problem-section-label">Concept</div>
      <p style="font-size:12px;color:var(--neon-blue);">📖 ${escapeHtml(problem.concept)}</p>
      ` : ''}
    </div>
  `;
}

// ─── Starter Code Management ───────────────────────────────────
function loadStarterCode() {
  const editor = document.getElementById('code-editor');
  const lang = document.getElementById('lang-select').value;
  if (!currentProblem || !editor) return;

  const starter = currentProblem.starter_code?.[lang] || `# Write your ${lang} solution here\n`;
  editor.value = starter;
}

function switchLanguage() {
  if (!currentProblem) return;
  loadStarterCode();
  resetResultsPanel();
}

function resetCode() {
  if (!currentProblem) return;
  loadStarterCode();
  resetResultsPanel();
  showToast('Code reset to starter template.', 'info');
}

function enableEditor() {
  const editor = document.getElementById('code-editor');
  const runBtn = document.getElementById('run-btn');
  const submitBtn = document.getElementById('submit-btn');
  const hintBtn = document.getElementById('hint-btn');
  if (editor) editor.disabled = false;
  if (runBtn) runBtn.disabled = false;
  if (submitBtn) submitBtn.disabled = false;
  if (hintBtn) hintBtn.disabled = false;
}

// ─── Run Code (Mock Execution) ─────────────────────────────────
async function runCode() {
  if (!currentProblem) { showToast('Please select a problem first.', 'warning'); return; }
  const code = document.getElementById('code-editor').value.trim();
  if (!code) { showToast('Please write some code first.', 'warning'); return; }

  const runBtn = document.getElementById('run-btn');
  runBtn.disabled = true;
  runBtn.textContent = '⏳ Running...';

  switchRightTab('results');
  document.getElementById('content-results').innerHTML = `
    <div class="ai-loading"><span class="spinner"></span> Running your code against test cases...</div>
  `;

  try {
    const lang = document.getElementById('lang-select').value;
    const data = await apiCall('/api/coding/run', {
      method: 'POST',
      body: JSON.stringify({
        problem_id: currentProblem.id,
        code,
        language: lang
      })
    });

    lastRunResults = data;
    renderRunResults(data);

    // Show demo mode badge if mock
    if (data.mock) {
      const badge = document.getElementById('demo-mode-badge');
      if (badge) badge.style.display = 'inline-flex';
    }

  } catch (err) {
    document.getElementById('content-results').innerHTML = `
      <div class="feedback-section issue">
        <div class="feedback-section-label issue">❌ Error</div>
        <div class="feedback-text">${escapeHtml(err.message || 'Failed to run code')}</div>
      </div>
    `;
    showToast('Run failed: ' + err.message, 'error');
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = '▶ Run';
  }
}

function renderRunResults(data) {
  const container = document.getElementById('content-results');
  const testResults = data.test_results || [];
  const allPassed = data.all_passed;

  const statusBanner = allPassed
    ? `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--radius-sm);background:rgba(16,255,176,0.1);border:1px solid rgba(16,255,176,0.3);margin-bottom:14px;">
        <span style="font-size:20px;">✅</span>
        <div><div style="font-weight:700;color:var(--neon-green);font-size:14px;">All Tests Passed!</div><div style="font-size:12px;color:var(--text-muted);">Great work! Submit to save your solution.</div></div>
       </div>`
    : `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--radius-sm);background:rgba(255,77,109,0.1);border:1px solid rgba(255,77,109,0.3);margin-bottom:14px;">
        <span style="font-size:20px;">❌</span>
        <div><div style="font-weight:700;color:var(--error);font-size:14px;">Some Tests Failed</div><div style="font-size:12px;color:var(--text-muted);">Submit to get AI feedback and hints.</div></div>
       </div>`;

  const outputHTML = `
    <div style="margin-bottom:14px;">
      <div class="problem-section-label" style="margin:0 0 8px;">Output</div>
      <div class="output-box">${escapeHtml(data.output || '(no output)')}</div>
    </div>
  `;

  const testsHTML = testResults.map(t => `
    <div class="test-case-item ${t.passed ? 'pass' : 'fail'}">
      <span class="test-status-icon">${t.passed ? '✅' : '❌'}</span>
      <div>
        <div style="font-size:13px;font-weight:600;color:${t.passed ? 'var(--neon-green)' : 'var(--error)'};">
          Test ${t.test_number}: ${t.passed ? 'Passed' : 'Failed'}
        </div>
        ${!t.passed ? `
          <div class="test-detail">Expected: <span style="color:var(--neon-green);">${escapeHtml(t.expected)}</span></div>
          <div class="test-detail">Got:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="color:var(--error);">${escapeHtml(t.actual || '(no output)')}</span></div>
        ` : `
          <div class="test-detail" style="color:var(--neon-green);">Output: ${escapeHtml(t.expected)}</div>
        `}
      </div>
    </div>
  `).join('');

  if (data.mock) {
    container.innerHTML = statusBanner + outputHTML +
      `<div class="problem-section-label" style="margin:0 0 8px;">Test Cases</div>` +
      testsHTML +
      `<div style="margin-top:14px;padding:10px;border-radius:var(--radius-sm);background:rgba(255,255,255,0.03);border:1px solid var(--border-color);">
        <div style="font-size:11px;color:var(--text-muted);">⚡ <strong>Demo Mode:</strong> Results are simulated. A real code execution sandbox is planned for production. <a href="../CODE_EXECUTION_SECURITY.md" style="color:var(--neon-blue);">Learn more →</a></div>
       </div>`;
  } else {
    container.innerHTML = statusBanner + outputHTML +
      `<div class="problem-section-label" style="margin:0 0 8px;">Test Cases</div>` + testsHTML;
  }
}

// ─── Submit Code ───────────────────────────────────────────────
async function submitCode() {
  if (!currentProblem) { showToast('Please select a problem first.', 'warning'); return; }
  const code = document.getElementById('code-editor').value.trim();
  if (!code) { showToast('Please write some code before submitting.', 'warning'); return; }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Submitting...';

  try {
    // First run to get results if not already done
    let runData = lastRunResults;
    if (!runData) {
      const lang = document.getElementById('lang-select').value;
      runData = await apiCall('/api/coding/run', {
        method: 'POST',
        body: JSON.stringify({ problem_id: currentProblem.id, code, language: lang })
      });
      lastRunResults = runData;
      renderRunResults(runData);
    }

    // Save submission
    const lang = document.getElementById('lang-select').value;
    const subData = await apiCall('/api/coding/submissions', {
      method: 'POST',
      body: JSON.stringify({
        problem_id: currentProblem.id,
        code,
        language: lang,
        status: runData.all_passed ? 'passed' : 'failed',
        output: runData.output,
        test_results: runData.test_results
      })
    });

    showToast('Code submitted! Getting AI feedback...', 'success');

    // Get AI feedback
    await getAIFeedback(code, lang, runData.test_results);
    switchRightTab('feedback');

    // Reload history
    await loadSubmissionHistory();

  } catch (err) {
    showToast('Submission failed: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '✓ Submit';
  }
}

// ─── AI Feedback ───────────────────────────────────────────────
async function getAIFeedback(code, language, testResults) {
  const emptyMsg = document.getElementById('feedback-empty');
  const content = document.getElementById('ai-feedback-content');

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (content) {
    content.style.display = 'block';
    content.innerHTML = `<div class="ai-loading"><span class="spinner"></span> AI is analyzing your code...</div>`;
  }

  try {
    const data = await apiCall('/api/ai/feedback', {
      method: 'POST',
      body: JSON.stringify({
        problem_id: currentProblem.id,
        code,
        language,
        test_results: testResults || []
      })
    });

    if (data.feedback) {
      renderAIFeedback(data.feedback, data.mock);
    }
  } catch (err) {
    if (content) {
      content.innerHTML = `
        <div class="feedback-section issue">
          <div class="feedback-section-label issue">⚠️ AI Feedback Unavailable</div>
          <div class="feedback-text">AI feedback is temporarily unavailable. Please review your code manually against the expected output.</div>
        </div>
      `;
    }
  }
}

function renderAIFeedback(feedback, isMock) {
  const content = document.getElementById('ai-feedback-content');
  if (!content) return;

  const allPassed = !feedback.detected_issue;

  const issueSection = feedback.detected_issue ? `
    <div class="feedback-section issue">
      <div class="feedback-section-label issue">🔍 Detected Issue</div>
      <div class="feedback-text">${escapeHtml(feedback.detected_issue)}</div>
    </div>
  ` : '';

  const hintSection = feedback.hint ? `
    <div class="feedback-section hint">
      <div class="feedback-section-label hint">💡 Hint</div>
      <div class="feedback-text">${escapeHtml(feedback.hint)}</div>
    </div>
  ` : '';

  const conceptSection = feedback.concept_explanation ? `
    <div class="feedback-section concept">
      <div class="feedback-section-label concept">📖 Concept</div>
      <div class="feedback-text">${escapeHtml(feedback.concept_explanation)}</div>
    </div>
  ` : '';

  const nextSection = feedback.suggested_next_step ? `
    <div class="feedback-section next">
      <div class="feedback-section-label next">➡️ Next Step</div>
      <div class="feedback-text">${escapeHtml(feedback.suggested_next_step)}</div>
    </div>
  ` : '';

  const mockBadge = isMock ? `
    <div style="font-size:11px;color:var(--text-muted);text-align:center;padding:6px;">⚡ Demo feedback — will use real AI when OpenAI key is configured.</div>
  ` : '';

  content.innerHTML = `
    <div class="ai-feedback-panel">
      <div class="ai-feedback-header">
        <span style="font-size:24px;">🤖</span>
        <div>
          <div class="ai-feedback-title">AI Learning Assistant</div>
          <div class="ai-feedback-subtitle">${allPassed ? 'Great job! Review what you did well.' : 'Guided feedback to help you learn.'}</div>
        </div>
      </div>
      ${issueSection}
      ${hintSection}
      ${conceptSection}
      ${nextSection}
      ${mockBadge}
      <div class="ai-actions">
        <button class="btn btn-primary" onclick="submitCode()" style="font-size:12px;padding:8px 16px;">🔄 Try Again</button>
        <button class="btn btn-ghost" onclick="getMoreExplanation()" style="font-size:12px;padding:8px 16px;">📖 Explain More</button>
      </div>
    </div>
  `;
}

// ─── Explain More (Ask AI Tutor) ───────────────────────────────
function getMoreExplanation() {
  if (!currentProblem) return;
  const concept = currentProblem.concept || currentProblem.topic || 'this programming concept';
  const url = `ai-assistant.html`;
  // Store context and redirect
  sessionStorage.setItem('ai_context', `Can you explain the concept of "${concept}" in detail with examples? I'm working on a coding problem called "${currentProblem.title}".`);
  window.location.href = url;
}

// ─── Get Next Hint ─────────────────────────────────────────────
function getNextHint() {
  if (!currentProblem) return;
  const hints = currentProblem.hints || [];
  if (!hints.length) {
    showToast('No hints available for this problem.', 'info');
    return;
  }

  const hint = hints[currentHintIndex % hints.length];
  currentHintIndex++;

  showToast(`💡 Hint ${currentHintIndex}: ${hint}`, 'info', 6000);
}

// ─── Submission History ────────────────────────────────────────
async function loadSubmissionHistory() {
  try {
    const data = await apiCall('/api/coding/submissions');
    renderHistory(data.submissions || []);
  } catch {
    // Silently fail — history is non-critical
  }
}

function renderHistory(submissions) {
  const container = document.getElementById('submission-history');
  if (!submissions.length) {
    container.innerHTML = `
      <div class="empty-state-msg">
        <span class="icon">📂</span>
        No submissions yet. Solve your first problem!
      </div>
    `;
    return;
  }

  container.innerHTML = submissions.slice(0, 20).map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--border-color);margin-bottom:8px;gap:8px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.problem_title || s.problem_id)}</div>
        <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(s.language)} · ${timeAgo(s.created_at)}</div>
      </div>
      <span style="font-size:11px;padding:3px 8px;border-radius:99px;flex-shrink:0;${
        s.status === 'passed'
          ? 'background:rgba(16,255,176,0.15);color:var(--neon-green);border:1px solid rgba(16,255,176,0.3);'
          : 'background:rgba(255,77,109,0.15);color:var(--error);border:1px solid rgba(255,77,109,0.3);'
      }">${s.status === 'passed' ? '✓ Passed' : '✗ Failed'}</span>
    </div>
  `).join('');
}

// ─── UI Helpers ────────────────────────────────────────────────
function switchRightTab(tab) {
  ['results', 'feedback', 'history'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`content-${t}`).style.display = t === tab ? 'block' : 'none';
  });
}

function resetResultsPanel() {
  document.getElementById('content-results').innerHTML = `
    <div class="empty-state-msg">
      <span class="icon">▶</span>
      Run your code to see results here.
    </div>
  `;
  switchRightTab('results');
}

function resetFeedbackPanel() {
  const emptyMsg = document.getElementById('feedback-empty');
  const content = document.getElementById('ai-feedback-content');
  if (emptyMsg) emptyMsg.style.display = 'block';
  if (content) { content.style.display = 'none'; content.innerHTML = ''; }
}
