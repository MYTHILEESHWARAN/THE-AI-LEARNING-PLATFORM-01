/* ═══════════════════════════════════════════════════════════════
   admin.js — Platform Administration Portal Logic
═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard(true)) return; // Admin only

  generateStars(60);
  setupSidebar();

  await loadAdminStats();
  await loadAdminUsers();
});

async function loadAdminStats() {
  try {
    const res = await apiCall('/api/admin/stats');
    const s = res.stats;

    document.getElementById('adm-total-users').textContent = s.total_users || 0;
    document.getElementById('adm-total-courses').textContent = s.total_courses || 0;
    document.getElementById('adm-total-enrollments').textContent = s.total_enrollments || 0;
    document.getElementById('adm-total-attempts').textContent = s.total_attempts || 0;
  } catch (err) {
    showToast('Failed to load admin stats', 'error');
  }
}

async function loadAdminUsers() {
  try {
    const res = await apiCall('/api/admin/users');
    const users = res.users || [];
    const tbody = document.getElementById('admin-users-table-body');
    const currentAdmin = getUser();

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const isSelf = u.id === currentAdmin.id || u.email === currentAdmin.email;
      return `
        <tr>
          <td>
            <div style="font-weight:600;color:#fff;">${escapeHtml(u.name)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(u.email)}</div>
          </td>
          <td>
            <span class="tag ${u.role === 'admin' ? 'tag-purple' : 'tag-cyan'}">
              ${u.role.toUpperCase()}
            </span>
          </td>
          <td>${u.courses_enrolled}</td>
          <td>${u.lessons_completed}</td>
          <td>${u.quizzes_taken}</td>
          <td>${formatDate(u.created_at)}</td>
          <td>
            ${isSelf ? '<span style="color:var(--text-dim);font-size:12px;">(You)</span>' : `
              <div style="display:flex;gap:6px;">
                <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px;" onclick="toggleUserRole('${u.id}', '${u.role}')">
                  Make ${u.role === 'admin' ? 'Student' : 'Admin'}
                </button>
                <button class="btn btn-danger" style="padding:4px 8px;font-size:11px;" onclick="deleteUser('${u.id}')">
                  🗑️
                </button>
              </div>
            `}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast('Failed to load users list', 'error');
  }
}

async function toggleUserRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'student' : 'admin';
  try {
    await apiCall(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    showToast(`User role changed to ${newRole}!`, 'success');
    await loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to permanently delete this user and their associated data?')) return;
  try {
    await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
    showToast('User removed successfully', 'info');
    await loadAdminStats();
    await loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openCreateCourseModal() {
  document.getElementById('course-modal').classList.add('active');
}

function closeCourseModal() {
  document.getElementById('course-modal').classList.remove('active');
}

async function handleCreateCourse(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-course');
  btn.disabled = true;

  try {
    const title = document.getElementById('adm-course-title').value.trim();
    const description = document.getElementById('adm-course-desc').value.trim();
    const category = document.getElementById('adm-course-category').value;
    const level = document.getElementById('adm-course-level').value;
    const duration_hours = document.getElementById('adm-course-duration').value;
    const instructor = document.getElementById('adm-course-instructor').value.trim();

    await apiCall('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify({ title, description, category, level, duration_hours, instructor })
    });

    showToast('Course created successfully! 🚀', 'success');
    closeCourseModal();
    document.getElementById('adm-course-title').value = '';
    document.getElementById('adm-course-desc').value = '';
    await loadAdminStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}
