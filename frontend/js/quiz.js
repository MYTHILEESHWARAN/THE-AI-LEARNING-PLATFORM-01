/* ═══════════════════════════════════════════════════════════════
   quiz.js — Interactive Quiz Engine, Scoring & Review System
═══════════════════════════════════════════════════════════════ */

let activeQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let secondsElapsed = 0;

document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const user = getUser();
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = 'flex';
  }

  await loadQuizCatalog();
  await loadAttemptHistory();
});

async function loadQuizCatalog() {
  try {
    const res = await apiCall('/api/quizzes');
    const grid = document.getElementById('quiz-catalog-grid');
    const quizzes = res.quizzes || [];

    if (quizzes.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);">No quizzes available currently.</div>`;
      return;
    }

    grid.innerHTML = quizzes.map(q => {
      const bestScoreText = q.best_score !== null ? `Best: ${q.best_score}%` : 'Not attempted';
      const bestScoreClass = q.best_score >= 80 ? 'tag-green' : q.best_score !== null ? 'tag-cyan' : 'tag-purple';

      return `
        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <span class="tag tag-cyan">${escapeHtml(q.category || 'General').toUpperCase()}</span>
              <span class="tag ${bestScoreClass}">${bestScoreText}</span>
            </div>
            <h3 style="font-size:18px;color:#fff;font-weight:700;margin-bottom:8px;">${escapeHtml(q.title)}</h3>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">${escapeHtml(q.description || '')}</p>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:14px;">
              <span>❓ ${q.question_count} Questions</span>
              <span>🔄 ${q.attempts_count} Attempts</span>
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="startQuiz('${q.id}')">
              Start Quiz ⚡
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showToast('Failed to load quizzes', 'error');
  }
}

async function loadAttemptHistory() {
  try {
    const res = await apiCall('/api/quizzes/attempts');
    const container = document.getElementById('quiz-history-container');
    const attempts = res.attempts || [];

    if (attempts.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No attempts recorded yet. Take a quiz to test your knowledge!</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${attempts.slice(0, 6).map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <div>
              <div style="font-weight:600;color:#fff;font-size:14px;">${escapeHtml(a.quiz_title)}</div>
              <div style="font-size:12px;color:var(--text-muted);">${formatDate(a.completed_at)} • Time: ${a.time_spent_seconds || 0}s</div>
            </div>
            <div style="text-align:right;">
              <span class="tag ${a.percentage >= 80 ? 'tag-green' : a.percentage >= 60 ? 'tag-cyan' : 'tag-purple'}" style="font-size:13px;font-weight:700;">
                ${a.percentage}% (${a.score}/${a.total_questions})
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {}
}

async function startQuiz(quizId) {
  try {
    const res = await apiCall(`/api/quizzes/${quizId}`);
    activeQuiz = res.quiz;
    currentQuestionIndex = 0;
    userAnswers = {};
    secondsElapsed = 0;

    document.getElementById('quiz-list-view').style.display = 'none';
    document.getElementById('quiz-results-view').style.display = 'none';
    document.getElementById('quiz-active-view').style.display = 'block';
    document.getElementById('btn-back-quizzes').style.display = 'inline-flex';

    document.getElementById('active-quiz-title').textContent = activeQuiz.title;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsElapsed++;
      const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
      const secs = String(secondsElapsed % 60).padStart(2, '0');
      document.getElementById('quiz-timer').textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);

    renderCurrentQuestion();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showQuizList() {
  clearInterval(timerInterval);
  document.getElementById('quiz-list-view').style.display = 'block';
  document.getElementById('quiz-active-view').style.display = 'none';
  document.getElementById('quiz-results-view').style.display = 'none';
  document.getElementById('btn-back-quizzes').style.display = 'none';
  loadQuizCatalog();
  loadAttemptHistory();
}

function renderCurrentQuestion() {
  const q = activeQuiz.questions[currentQuestionIndex];
  const total = activeQuiz.questions.length;

  document.getElementById('active-quiz-counter').textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  document.getElementById('quiz-step-progress').style.width = `${Math.round(((currentQuestionIndex + 1) / total) * 100)}%`;
  document.getElementById('current-question-text').textContent = q.question_text;

  const btnPrev = document.getElementById('btn-prev-q');
  btnPrev.style.visibility = currentQuestionIndex > 0 ? 'visible' : 'hidden';

  const btnNext = document.getElementById('btn-next-q');
  btnNext.textContent = currentQuestionIndex === total - 1 ? 'Submit Answers 🚀' : 'Next Question →';

  const optionsContainer = document.getElementById('quiz-options-container');
  const selectedAnswer = userAnswers[q.id];

  optionsContainer.innerHTML = (q.options || []).map((opt, optIdx) => {
    const isSelected = selectedAnswer === optIdx;
    return `
      <div class="quiz-option ${isSelected ? 'selected' : ''}" onclick="selectQuizOption('${q.id}', ${optIdx})">
        <div style="width:24px;height:24px;border-radius:50%;border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--accent-cyan);background:rgba(255,255,255,0.03);">
          ${String.fromCharCode(65 + optIdx)}
        </div>
        <div style="flex:1;font-size:14px;color:var(--text-main);">${escapeHtml(opt)}</div>
      </div>
    `;
  }).join('');
}

function selectQuizOption(questionId, optionIndex) {
  userAnswers[questionId] = optionIndex;
  renderCurrentQuestion();
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
}

async function nextQuestion() {
  const total = activeQuiz.questions.length;
  if (currentQuestionIndex < total - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  } else {
    // Submit Quiz
    await submitQuizAttempt();
  }
}

async function submitQuizAttempt() {
  clearInterval(timerInterval);
  const btnNext = document.getElementById('btn-next-q');
  btnNext.disabled = true;
  btnNext.innerHTML = 'Grading... ⏳';

  try {
    const res = await apiCall(`/api/quizzes/${activeQuiz.id}/attempt`, {
      method: 'POST',
      body: JSON.stringify({
        answers: userAnswers,
        time_spent_seconds: secondsElapsed
      })
    });

    document.getElementById('quiz-active-view').style.display = 'none';
    document.getElementById('quiz-results-view').style.display = 'block';

    const pct = res.percentage;
    document.getElementById('result-score-pct').textContent = `${pct}%`;
    document.getElementById('result-score-fraction').textContent = 
      `You scored ${res.score} out of ${res.total_questions} questions correctly in ${secondsElapsed}s.`;

    const trophy = document.getElementById('result-trophy');
    const headline = document.getElementById('result-headline');
    if (pct === 100) {
      trophy.textContent = '🌟';
      headline.textContent = 'Flawless Mastery! 100%';
    } else if (pct >= 80) {
      trophy.textContent = '🏆';
      headline.textContent = 'Excellent Work!';
    } else if (pct >= 60) {
      trophy.textContent = '👍';
      headline.textContent = 'Good Job! Review mistakes below:';
    } else {
      trophy.textContent = '📚';
      headline.textContent = 'Keep Practicing!';
    }

    // Breakdown
    const breakdown = document.getElementById('quiz-review-breakdown');
    breakdown.innerHTML = (res.results || []).map((r, idx) => `
      <div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border-left:4px solid ${r.is_correct ? 'var(--accent-green)' : 'var(--accent-red)'};border-top:1px solid var(--border-color);border-right:1px solid var(--border-color);border-bottom:1px solid var(--border-color);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span>${r.is_correct ? '✅ Correct' : '❌ Incorrect'}</span>
          <span style="font-weight:700;color:#fff;">Question ${idx+1}: ${escapeHtml(r.question_text)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">
          Your Answer: <span style="color:${r.is_correct ? 'var(--accent-green)' : 'var(--accent-red)'};font-weight:600;">
            ${r.user_answer !== undefined && r.options ? escapeHtml(r.options[r.user_answer] || 'No answer selected') : 'None'}
          </span>
        </div>
        ${!r.is_correct ? `
          <div style="font-size:13px;color:var(--accent-green);margin-bottom:6px;">
            Correct Answer: <strong>${r.options ? escapeHtml(r.options[r.correct_option]) : ''}</strong>
          </div>
        ` : ''}
        ${r.explanation ? `
          <div style="font-size:12px;color:var(--text-dim);background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;margin-top:6px;">
            💡 <em>Explanation:</em> ${escapeHtml(r.explanation)}
          </div>
        ` : ''}
      </div>
    `).join('');

    showToast('Quiz submitted and scored!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnNext.disabled = false;
  }
}

function retakeCurrentQuiz() {
  if (activeQuiz) {
    startQuiz(activeQuiz.id);
  }
}
