/* ═══════════════════════════════════════════════════════════════
   analytics.js — Canvas-based Visual Performance Charts
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

  await loadAnalyticsData();
});

async function loadAnalyticsData() {
  try {
    const res = await apiCall('/api/analytics');
    const an = res.analytics;

    document.getElementById('an-avg-score').textContent = `${an.average_quiz_score || 0}%`;
    document.getElementById('an-lessons-completed').textContent = an.total_lessons_completed || 0;

    // Render Canvas Bar Chart for Weekly Activity
    renderWeeklyChart(an.weekly_activity || []);

    // Render Course Progress Bars
    renderCourseProgress(an.course_progress || []);

    // Render Full Activity Timeline
    renderActivityTimeline(an.recent_activity || []);

  } catch (err) {
    showToast('Failed to load analytics', 'error');
  }
}

function renderWeeklyChart(weeklyData) {
  const canvas = document.getElementById('weeklyActivityCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 240 * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };

  ctx.clearRect(0, 0, width, height);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxVal = Math.max(...weeklyData.map(d => d.hours), 4);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#5a6485';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    const val = ((4 - i) * (maxVal / 4)).toFixed(1);
    ctx.fillText(`${val}h`, padding.left - 6, y + 3);
  }

  // Draw Bars
  const barWidth = Math.min(36, (chartWidth / weeklyData.length) * 0.6);
  const gap = chartWidth / weeklyData.length;

  weeklyData.forEach((d, i) => {
    const x = padding.left + i * gap + (gap - barWidth) / 2;
    const barHeight = (d.hours / maxVal) * chartHeight;
    const y = padding.top + chartHeight - barHeight;

    // Gradient bar fill
    const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
    grad.addColorStop(0, '#00f2fe');
    grad.addColorStop(1, '#4facfe');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
    ctx.fill();

    // Day label
    ctx.fillStyle = '#8b95b5';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.day, x + barWidth / 2, height - 10);
  });
}

function renderCourseProgress(courseList) {
  const container = document.getElementById('course-progress-list');
  if (courseList.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No enrolled courses yet.</div>`;
    return;
  }

  container.innerHTML = courseList.map(c => `
    <div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
        <span style="font-weight:600;color:#fff;">${escapeHtml(c.course_title)}</span>
        <span style="color:var(--accent-cyan);font-weight:700;">${c.progress_percentage}%</span>
      </div>
      <div class="progress-bar" style="margin:0;">
        <div class="progress-fill" style="width:${c.progress_percentage}%;"></div>
      </div>
      <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">
        ${c.completed_lessons} of ${c.total_lessons} lessons completed
      </div>
    </div>
  `).join('');
}

function renderActivityTimeline(activities) {
  const container = document.getElementById('full-activity-timeline');
  if (activities.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No activities recorded yet.</div>`;
    return;
  }

  container.innerHTML = activities.map(a => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:18px;">${a.type === 'quiz' ? '⚡' : '📖'}</span>
        <div>
          <div style="color:#fff;font-size:14px;font-weight:500;">${escapeHtml(a.title)}</div>
          <div style="font-size:11px;color:var(--text-muted);">${formatDate(a.date)} • ${timeAgo(a.date)}</div>
        </div>
      </div>
      <span class="tag ${a.type === 'quiz' ? 'tag-purple' : 'tag-green'}">${a.type.toUpperCase()}</span>
    </div>
  `).join('');
}
