/* ═══════════════════════════════════════════════════════════════
   app.js — Shared App Utilities
   Auth guard, API helpers, sidebar, toast, navigation
═══════════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:3001';

// ─── Auth ──────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('lp_token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('lp_user') || '{}'); } catch { return {}; } }

function authGuard(requireAdmin = false) {
  const token = getToken();
  if (!token) { window.location.href = '/login.html'; return false; }
  if (requireAdmin) {
    const user = getUser();
    if (user.role !== 'admin') { window.location.href = '/dashboard.html'; return false; }
  }
  return true;
}

function logout() {
  localStorage.removeItem('lp_token');
  localStorage.removeItem('lp_user');
  localStorage.removeItem('lp_stats');
  window.location.href = '/login.html';
}

// ─── API Helper ────────────────────────────────────────────────
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (res.status === 401 || res.status === 403) {
    if (res.status === 401) logout();
    throw new Error(data.error || 'Unauthorized');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Toast Notifications ───────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Star Field ────────────────────────────────────────────────
function generateStars(count = 120) {
  const container = document.getElementById('stars-container');
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    const x = Math.random() * 100, y = Math.random() * 100;
    star.style.cssText = `left:${x}%;top:${y}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*5}s;--max-opacity:${0.3+Math.random()*0.7};width:${Math.random()<0.8?1:2}px;height:${Math.random()<0.8?1:2}px;`;
    container.appendChild(star);
  }
}

// ─── Sidebar Navigation Setup ──────────────────────────────────
function setupSidebar() {
  const user = getUser();
  // Set user info in sidebar
  const nameEl   = document.getElementById('sidebar-user-name');
  const emailEl  = document.getElementById('sidebar-user-email');
  const avatarEl = document.getElementById('sidebar-avatar');
  const roleEl   = document.getElementById('sidebar-user-role');

  if (nameEl)   nameEl.textContent   = user.name || 'Student';
  if (emailEl)  emailEl.textContent  = user.email || '';
  if (avatarEl) avatarEl.textContent = (user.name || 'S')[0].toUpperCase();
  if (roleEl)   roleEl.textContent   = user.role === 'admin' ? '👑 Admin' : '🎓 Student';

  // Highlight active nav item
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href && href.includes(currentPage)) {
      item.classList.add('active');
    }
  });

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // Load notification badge
  loadNotificationBadge();
}

async function loadNotificationBadge() {
  try {
    const data = await apiCall('/api/notifications');
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = data.unread;
      badge.style.display = data.unread > 0 ? 'flex' : 'none';
    }
  } catch {}
}

// ─── Format Helpers ────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Progress Bar ──────────────────────────────────────────────
function createProgressBar(percent, color = 'var(--neon-blue)') {
  return `
    <div class="progress-bar-wrap">
      <div class="progress-bar" style="width:${Math.min(100,percent)}%;background:${color};"></div>
    </div>
  `;
}

// ─── Animate Count ─────────────────────────────────────────────
function animateCount(el, target, duration = 800) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();
  function update(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ─── Sidebar HTML Template ─────────────────────────────────────
function getSidebarHTML(activePage = '') {
  const user = getUser();
  const isAdmin = user.role === 'admin';

  return `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-logo">📚</div>
          <div>
            <div class="sidebar-brand-name">LearnAI</div>
            <div class="sidebar-brand-sub">Platform</div>
          </div>
        </div>
        <button class="sidebar-close" id="sidebar-close-btn" onclick="document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebar-overlay').classList.remove('show');">✕</button>
      </div>

      <div class="sidebar-user-card">
        <div class="sidebar-avatar" id="sidebar-avatar">?</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name" id="sidebar-user-name">Loading...</div>
          <div class="sidebar-user-role" id="sidebar-user-role">Student</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Main</div>
        <a href="/dashboard.html" class="nav-item ${activePage==='dashboard'?'active':''}">
          <span class="nav-icon">🏠</span><span>Dashboard</span>
        </a>
        <a href="/courses.html" class="nav-item ${activePage==='courses'?'active':''}">
          <span class="nav-icon">📖</span><span>Courses</span>
        </a>
        <a href="/ai-assistant.html" class="nav-item ${activePage==='ai'?'active':''}">
          <span class="nav-icon">🤖</span><span>AI Assistant</span>
        </a>
        <a href="/quiz.html" class="nav-item ${activePage==='quiz'?'active':''}">
          <span class="nav-icon">🧠</span><span>Quizzes</span>
        </a>
        <a href="/planner.html" class="nav-item ${activePage==='planner'?'active':''}">
          <span class="nav-icon">📅</span><span>Study Planner</span>
        </a>

        <div class="nav-section-label">Progress</div>
        <a href="/analytics.html" class="nav-item ${activePage==='analytics'?'active':''}">
          <span class="nav-icon">📊</span><span>Analytics</span>
        </a>
        <a href="/profile.html" class="nav-item ${activePage==='profile'?'active':''}">
          <span class="nav-icon">👤</span><span>Profile</span>
        </a>
        <a href="/notifications.html" class="nav-item ${activePage==='notifications'?'active':''}">
          <span class="nav-icon">🔔</span><span>Notifications</span>
          <span class="nav-badge" id="notif-badge" style="display:none;">0</span>
        </a>

        ${isAdmin ? `
        <div class="nav-section-label">Admin</div>
        <a href="/admin.html" class="nav-item ${activePage==='admin'?'active':''}">
          <span class="nav-icon">👑</span><span>Admin Panel</span>
        </a>
        ` : ''}
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item btn-logout-sidebar" onclick="logout()">
          <span class="nav-icon">⎋</span><span>Logout</span>
        </button>
      </div>
    </aside>
  `;
}

// ─── Top Navbar HTML ──────────────────────────────────────────
function getTopNavHTML(pageTitle = 'Dashboard') {
  return `
    <header class="app-topbar">
      <button class="sidebar-toggle" id="sidebar-toggle">☰</button>
      <h1 class="topbar-title">${pageTitle}</h1>
      <div class="topbar-right">
        <a href="/notifications.html" class="topbar-icon-btn" title="Notifications">
          🔔 <span class="notif-dot" id="notif-dot" style="display:none;"></span>
        </a>
        <a href="/profile.html" class="topbar-user-pill">
          <span class="topbar-avatar" id="topbar-avatar">?</span>
          <span id="topbar-username">Loading...</span>
        </a>
      </div>
    </header>
  `;
}

// Initialize topbar user info
function initTopbar() {
  const user = getUser();
  const av = document.getElementById('topbar-avatar');
  const un = document.getElementById('topbar-username');
  if (av) av.textContent = (user.name || 'S')[0].toUpperCase();
  if (un) un.textContent = user.name || 'Student';
}
