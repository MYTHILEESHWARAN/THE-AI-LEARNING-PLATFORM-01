/* ═══════════════════════════════════════════════════════════════
   course-detail.js — Interactive Lesson Player & Syllabus Tracker
═══════════════════════════════════════════════════════════════ */

let courseData = null;
let currentLesson = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    window.location.href = 'courses.html';
    return;
  }

  await loadCourseDetail(courseId);
});

async function loadCourseDetail(courseId) {
  try {
    const res = await apiCall(`/api/courses/${courseId}`);
    courseData = res.course;

    document.getElementById('course-title-top').textContent = courseData.title;
    updateProgressUI();
    renderSyllabus();

    // Auto-select first lesson or first uncompleted lesson
    let targetLesson = null;
    let targetModule = null;

    if (courseData.modules && courseData.modules.length > 0) {
      for (const m of courseData.modules) {
        if (m.lessons && m.lessons.length > 0) {
          const uncompleted = m.lessons.find(l => !l.completed);
          if (uncompleted) {
            targetLesson = uncompleted;
            targetModule = m;
            break;
          }
        }
      }
      if (!targetLesson && courseData.modules[0].lessons.length > 0) {
        targetLesson = courseData.modules[0].lessons[0];
        targetModule = courseData.modules[0];
      }
    }

    if (targetLesson) {
      selectLesson(targetLesson, targetModule);
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateProgressUI() {
  const pct = courseData.progress_percentage || 0;
  document.getElementById('course-progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-percentage-label').textContent = `${pct}%`;
  document.getElementById('course-progress-text').textContent = 
    `${courseData.completed_lessons} / ${courseData.total_lessons} Lessons Completed`;
}

function renderSyllabus() {
  const container = document.getElementById('modules-container');
  if (!courseData.modules || courseData.modules.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">No modules found for this course.</div>`;
    return;
  }

  container.innerHTML = courseData.modules.map((m, mIdx) => `
    <div class="module-accordion">
      <div class="module-header" onclick="toggleModule(${mIdx})">
        <span>${escapeHtml(m.title)}</span>
        <span style="font-size:11px;color:var(--text-dim);">${(m.lessons || []).length} lessons</span>
      </div>
      <div id="module-lessons-${mIdx}">
        ${(m.lessons || []).map(l => `
          <div class="lesson-item ${currentLesson && currentLesson.id === l.id ? 'active' : ''}" 
               id="lesson-nav-${l.id}"
               onclick='selectLesson(${JSON.stringify(l)}, ${JSON.stringify(m)})'>
            <span>${l.completed ? '✅' : '⚪'} ${escapeHtml(l.title)}</span>
            <span style="font-size:11px;color:var(--text-dim);">${l.duration_minutes || 15}m</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function toggleModule(mIdx) {
  const el = document.getElementById(`module-lessons-${mIdx}`);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function selectLesson(lesson, moduleObj) {
  currentLesson = lesson;

  document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`lesson-nav-${lesson.id}`);
  if (activeNav) activeNav.classList.add('active');

  document.getElementById('current-lesson-module').textContent = moduleObj ? moduleObj.title : 'Module';
  document.getElementById('current-lesson-title').textContent = lesson.title;

  const statusBadge = document.getElementById('lesson-status-badge');
  const completeBtn = document.getElementById('btn-complete-lesson');

  if (lesson.completed) {
    statusBadge.style.display = 'inline-block';
    completeBtn.style.display = 'none';
  } else {
    statusBadge.style.display = 'none';
    completeBtn.style.display = 'inline-flex';
  }

  // Format lesson body (supports code blocks and paragraphs)
  let contentHtml = escapeHtml(lesson.content || 'Content coming soon...');
  contentHtml = contentHtml.replace(/\n\n/g, '<br><br>');
  
  document.getElementById('current-lesson-content').innerHTML = `
    <div style="font-size:15px;line-height:1.7;">
      ${contentHtml}
    </div>
    <div style="margin-top:24px;padding:16px;background:rgba(0,242,254,0.05);border-radius:var(--radius-sm);border:1px solid rgba(0,242,254,0.2);">
      <div style="font-weight:600;color:var(--accent-cyan);margin-bottom:6px;">💡 Key Takeaway:</div>
      <p style="font-size:13px;color:var(--text-muted);">Make sure to review the core concepts before proceeding to the quiz or next lesson!</p>
    </div>
  `;
}

async function handleCompleteCurrentLesson() {
  if (!currentLesson) return;

  try {
    const res = await apiCall(`/api/lessons/${currentLesson.id}/complete`, { method: 'POST' });
    showToast('Lesson marked as complete! 🎉', 'success');

    currentLesson.completed = 1;
    courseData.progress_percentage = res.course_progress;
    courseData.completed_lessons = res.completed_lessons;

    updateProgressUI();
    renderSyllabus();

    const statusBadge = document.getElementById('lesson-status-badge');
    const completeBtn = document.getElementById('btn-complete-lesson');
    statusBadge.style.display = 'inline-block';
    completeBtn.style.display = 'none';

  } catch (err) {
    showToast(err.message, 'error');
  }
}
