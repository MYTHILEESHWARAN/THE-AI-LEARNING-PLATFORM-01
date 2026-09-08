/* ═══════════════════════════════════════════════════════════════
   courses.js — Course Catalog Filtering & Enrollment
═══════════════════════════════════════════════════════════════ */

let allCourses = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const user = getUser();
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = 'flex';
  }

  await loadCourses();
});

async function loadCourses() {
  try {
    const data = await apiCall('/api/courses');
    allCourses = data.courses || [];
    renderCourses(allCourses);
  } catch (err) {
    showToast('Failed to load courses', 'error');
  }
}

function renderCourses(courses) {
  const grid = document.getElementById('courses-grid');
  if (courses.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted);">
        <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
        <h3>No courses match your filter criteria</h3>
        <p style="font-size: 14px; margin-top: 6px;">Try adjusting your search keywords or resetting filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = courses.map(c => {
    const isEnrolled = !!c.is_enrolled;
    const catTagClass = c.category === 'ai' ? 'tag-cyan' : c.category === 'web' ? 'tag-purple' : 'tag-green';
    
    return `
      <div class="course-card">
        <img src="${escapeHtml(c.thumbnail)}" alt="${escapeHtml(c.title)}" class="course-thumb" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'">
        <div class="course-body">
          <div class="course-tags">
            <span class="tag ${catTagClass}">${c.category.toUpperCase()}</span>
            <span class="tag tag-cyan">${c.level.toUpperCase()}</span>
            ${isEnrolled ? '<span class="tag tag-green">Enrolled</span>' : ''}
          </div>
          <h3 class="course-title">${escapeHtml(c.title)}</h3>
          <p class="course-desc">${escapeHtml(c.description)}</p>
          <div class="course-footer">
            <span>⏱️ ${c.duration_hours}h • 📖 ${c.lesson_count} Lessons</span>
            ${isEnrolled 
              ? `<a href="course-detail.html?id=${c.id}" class="btn btn-secondary" style="font-size:12px;padding:6px 14px;">Go to Course →</a>`
              : `<button class="btn btn-primary" style="font-size:12px;padding:6px 14px;" onclick="enrollCourse('${c.id}')">Enroll Free</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleFilterChange() {
  const search = (document.getElementById('course-search-input').value || '').toLowerCase();
  const category = document.getElementById('filter-category').value;
  const level = document.getElementById('filter-level').value;

  const filtered = allCourses.filter(c => {
    const matchesSearch = !search || 
      (c.title && c.title.toLowerCase().includes(search)) || 
      (c.description && c.description.toLowerCase().includes(search));
    const matchesCategory = category === 'all' || c.category === category;
    const matchesLevel = level === 'all' || c.level === level;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  renderCourses(filtered);
}

async function enrollCourse(courseId) {
  try {
    await apiCall(`/api/courses/${courseId}/enroll`, { method: 'POST' });
    showToast('Enrolled successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = `course-detail.html?id=${courseId}`;
    }, 700);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
