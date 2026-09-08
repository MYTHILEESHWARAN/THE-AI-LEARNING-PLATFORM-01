/* ═══════════════════════════════════════════════════════════════
   dashboard.js — Student Dashboard Logic
═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const user = getUser();
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = 'flex';
  }

  const heading = document.getElementById('welcome-heading');
  if (heading && user.name) {
    heading.textContent = `Welcome back, ${user.name}! 👋`;
  }

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    // 1. Load Profile / Stats
    const profileData = await apiCall('/api/profile');
    if (profileData.user && profileData.user.stats) {
      const s = profileData.user.stats;
      document.getElementById('stat-courses').textContent = s.courses_enrolled || 0;
      document.getElementById('stat-lessons').textContent = s.lessons_completed || 0;
      document.getElementById('stat-quizzes').textContent = s.quizzes_taken || 0;
      document.getElementById('stat-achievements').textContent = s.achievements_earned || 0;
    }

    // 2. Load Enrolled Courses
    const coursesData = await apiCall('/api/courses');
    const enrolledCourses = coursesData.courses.filter(c => c.is_enrolled);
    const continueList = document.getElementById('continue-learning-list');

    if (enrolledCourses.length === 0) {
      continueList.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--text-muted);">
          <p>You haven't enrolled in any courses yet.</p>
          <a href="courses.html" class="btn btn-primary" style="margin-top:12px;display:inline-flex;">Explore Courses 🚀</a>
        </div>
      `;
    } else {
      continueList.innerHTML = enrolledCourses.slice(0, 3).map(c => `
        <div style="background:rgba(255,255,255,0.03);padding:14px 18px;border-radius:var(--radius-sm);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;gap:16px;">
          <div style="flex:1;">
            <div style="font-weight:600;color:#fff;font-size:15px;margin-bottom:4px;">${escapeHtml(c.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${c.category.toUpperCase()} • ${c.lesson_count} Lessons</div>
          </div>
          <a href="course-detail.html?id=${c.id}" class="btn btn-secondary" style="font-size:12px;padding:6px 14px;white-space:nowrap;">
            Continue →
          </a>
        </div>
      `).join('');
    }

    // 3. Load Planner Tasks
    const plannerData = await apiCall('/api/planner/tasks');
    const tasksList = document.getElementById('dashboard-tasks-list');
    const pendingTasks = (plannerData.tasks || []).filter(t => !t.completed).slice(0, 3);

    if (pendingTasks.length === 0) {
      tasksList.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No pending study tasks! You're all caught up. 🎉</div>`;
    } else {
      tasksList.innerHTML = pendingTasks.map(t => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:14px;">📌</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:#fff;">${escapeHtml(t.title)}</div>
              <div style="font-size:11px;color:var(--text-muted);">${t.subject} • Due: ${formatDate(t.due_date)}</div>
            </div>
          </div>
          <button class="btn btn-secondary" style="font-size:11px;padding:4px 8px;" onclick="quickCompleteTask('${t.id}')">✓ Done</button>
        </div>
      `).join('');
    }

    // 4. Load Recent Activity
    const analyticsData = await apiCall('/api/analytics');
    const activityList = document.getElementById('dashboard-activity-list');
    const activities = (analyticsData.analytics && analyticsData.analytics.recent_activity) || [];

    if (activities.length === 0) {
      activityList.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No recent activity. Start by completing a lesson or quiz!</div>`;
    } else {
      activityList.innerHTML = activities.slice(0, 4).map(a => `
        <div style="display:flex;align-items:center;gap:12px;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span>${a.type === 'quiz' ? '⚡' : '📖'}</span>
          <div style="flex:1;">
            <div style="color:var(--text-main);font-weight:500;">${escapeHtml(a.title)}</div>
            <div style="font-size:11px;color:var(--text-dim);">${timeAgo(a.date)}</div>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error('Error loading dashboard:', err);
    showToast('Failed to load dashboard data', 'error');
  }
}

async function quickCompleteTask(taskId) {
  try {
    await apiCall(`/api/planner/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: 1 })
    });
    showToast('Task completed! 🎉', 'success');
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleQuickSummarize() {
  const text = document.getElementById('quick-notes-input').value.trim();
  if (text.length < 10) {
    showToast('Please enter at least 10 characters of notes.', 'warning');
    return;
  }
  const resultBox = document.getElementById('quick-tool-result');
  resultBox.style.display = 'block';
  resultBox.innerHTML = '<div style="color:var(--accent-cyan);">Generating AI summary...</div>';

  try {
    const data = await apiCall('/summarize', {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    const bullets = data.summary || [];
    resultBox.innerHTML = `
      <div style="font-weight:700;color:var(--accent-cyan);margin-bottom:8px;">📌 AI Key Insights:</div>
      <ul style="padding-left:18px;line-height:1.6;">
        ${bullets.map(b => `<li style="margin-bottom:6px;">${escapeHtml(b)}</li>`).join('')}
      </ul>
    `;
    showToast('Summary generated successfully!', 'success');
  } catch (err) {
    resultBox.innerHTML = `<div style="color:var(--accent-red);">Error: ${err.message}</div>`;
  }
}

async function handleQuickQuiz() {
  const text = document.getElementById('quick-notes-input').value.trim();
  if (text.length < 20) {
    showToast('Please enter at least 20 characters of notes.', 'warning');
    return;
  }
  const resultBox = document.getElementById('quick-tool-result');
  resultBox.style.display = 'block';
  resultBox.innerHTML = '<div style="color:var(--accent-green);">Generating AI quiz questions...</div>';

  try {
    const data = await apiCall('/quiz', {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    const questions = data.questions || [];
    resultBox.innerHTML = `
      <div style="font-weight:700;color:var(--accent-green);margin-bottom:8px;">🎯 Practice Questions Generated:</div>
      ${questions.slice(0, 3).map((q, idx) => `
        <div style="margin-bottom:12px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px;">
          <div style="font-weight:600;color:#fff;margin-bottom:4px;">${idx+1}. ${escapeHtml(q.question)}</div>
          <div style="color:var(--text-muted);font-size:12px;">Answer: Option ${q.correctIndex + 1} • ${escapeHtml(q.explanation || '')}</div>
        </div>
      `).join('')}
      <a href="quiz.html" class="btn btn-secondary" style="font-size:12px;margin-top:8px;width:100%;">Take More Quizzes in Quiz Center →</a>
    `;
    showToast('Quiz generated successfully!', 'success');
  } catch (err) {
    resultBox.innerHTML = `<div style="color:var(--accent-red);">Error: ${err.message}</div>`;
  }
}
