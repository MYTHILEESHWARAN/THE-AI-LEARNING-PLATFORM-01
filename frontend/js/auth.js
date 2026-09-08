/* ═══════════════════════════════════════════════════════════════
   auth.js — Login / Signup Page Logic
═══════════════════════════════════════════════════════════════ */

// Use localhost:3001 for backend calls
const API_BASE = 'http://localhost:3001';

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (localStorage.getItem('lp_token')) {
    window.location.href = '/dashboard.html';
    return;
  }
  generateStars();
});

// ─── Tab Switcher ──────────────────────────────────────────────
function switchTab(tab) {
  const loginForm  = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    clearErrors();
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    clearErrors();
  }
}

// ─── Login ─────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');
  const spinner  = document.getElementById('login-spinner');
  const label    = btn.querySelector('.btn-label');

  clearErrors();
  setLoading(btn, spinner, label, true, 'Signing in…');

  try {
    const res  = await fetch(`${API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Login failed.');

    // Save token and user info
    localStorage.setItem('lp_token', data.token);
    localStorage.setItem('lp_user',  JSON.stringify(data.user));

    showToast('Welcome back, ' + data.user.name + '! 🚀', 'success');

    // Small delay then redirect
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 600);

  } catch (err) {
    showError(errorEl, err.message);
    setLoading(btn, spinner, label, false, 'Sign In');
  }
}

// ─── Signup ────────────────────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errorEl  = document.getElementById('signup-error');
  const btn      = document.getElementById('signup-btn');
  const spinner  = document.getElementById('signup-spinner');
  const label    = btn.querySelector('.btn-label');

  clearErrors();

  if (!name) return showError(errorEl, 'Please enter your name.');
  if (password.length < 6) return showError(errorEl, 'Password must be at least 6 characters.');

  setLoading(btn, spinner, label, true, 'Creating account…');

  try {
    const res  = await fetch(`${API_BASE}/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Signup failed.');

    localStorage.setItem('lp_token', data.token);
    localStorage.setItem('lp_user',  JSON.stringify(data.user));

    showToast('Account created! Welcome aboard, ' + data.user.name + '! 🎉', 'success');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 700);

  } catch (err) {
    showError(errorEl, err.message);
    setLoading(btn, spinner, label, false, 'Create Account');
  }
}

// ─── Helpers ───────────────────────────────────────────────────
function setLoading(btn, spinner, label, loading, labelText) {
  btn.disabled = loading;
  spinner.classList.toggle('hidden', !loading);
  label.textContent = labelText;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearErrors() {
  ['login-error', 'signup-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

// ─── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ─── Star Field ────────────────────────────────────────────────
function generateStars() {
  const container = document.getElementById('stars-container');
  if (!container) return;
  const count = 120;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    const x    = Math.random() * 100;
    const y    = Math.random() * 100;
    const dur  = 2 + Math.random() * 4;
    const delay = Math.random() * 5;
    const opacity = 0.3 + Math.random() * 0.7;
    star.style.cssText = `
      left: ${x}%; top: ${y}%;
      --dur: ${dur}s; --delay: ${delay}s; --max-opacity: ${opacity};
      width: ${Math.random() < 0.8 ? 1 : 2}px;
      height: ${Math.random() < 0.8 ? 1 : 2}px;
    `;
    container.appendChild(star);
  }
}
