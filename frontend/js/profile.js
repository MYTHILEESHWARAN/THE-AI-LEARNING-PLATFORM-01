/* ═══════════════════════════════════════════════════════════════
   profile.js — User Profile & Achievements Logic
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

  await loadProfileData();
  await loadAchievements();
});

async function loadProfileData() {
  try {
    const res = await apiCall('/api/profile');
    const u = res.user;

    document.getElementById('prof-name').value = u.name || '';
    document.getElementById('prof-email').value = u.email || '';
    document.getElementById('prof-bio').value = u.bio || '';
  } catch (err) {
    showToast('Failed to load profile', 'error');
  }
}

async function loadAchievements() {
  try {
    const res = await apiCall('/api/achievements');
    const achs = res.achievements || [];
    const grid = document.getElementById('achievements-grid');

    document.getElementById('achievements-summary-text').textContent = 
      `${res.total_earned} / ${res.total_available} Badges Unlocked (${res.completion_percentage}%)`;

    grid.innerHTML = achs.map(a => `
      <div class="badge-card ${a.earned ? 'earned' : 'unearned'}">
        <div class="badge-icon">${a.icon}</div>
        <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:4px;">${escapeHtml(a.title)}</div>
        <div style="font-size:11px;color:var(--text-muted);line-height:1.4;">${escapeHtml(a.description)}</div>
        <div style="font-size:10px;margin-top:10px;color:${a.earned ? 'var(--accent-cyan)' : 'var(--text-dim)'};">
          ${a.earned ? `Unlocked ${formatDate(a.earned_at)}` : '🔒 Locked'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load achievements', 'error');
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-profile');
  btn.disabled = true;

  try {
    const name = document.getElementById('prof-name').value.trim();
    const bio = document.getElementById('prof-bio').value.trim();

    const res = await apiCall('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, bio })
    });

    const user = getUser();
    user.name = res.user.name;
    user.bio = res.user.bio;
    localStorage.setItem('lp_user', JSON.stringify(user));

    setupSidebar();
    showToast('Profile updated successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-change-pass');
  btn.disabled = true;

  try {
    const current_password = document.getElementById('prof-curr-pass').value;
    const new_password = document.getElementById('prof-new-pass').value;

    await apiCall('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password })
    });

    showToast('Password changed successfully!', 'success');
    document.getElementById('prof-curr-pass').value = '';
    document.getElementById('prof-new-pass').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}
