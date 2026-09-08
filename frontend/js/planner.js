/* ═══════════════════════════════════════════════════════════════
   planner.js — Study Task Management & Schedule Tracker
═══════════════════════════════════════════════════════════════ */

let allTasks = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const user = getUser();
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = 'flex';
  }

  // Set default due date to tomorrow
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const dateInput = document.getElementById('task-due-date');
  if (dateInput) dateInput.value = tmrw.toISOString().split('T')[0];

  await loadTasks();
});

async function loadTasks() {
  try {
    const res = await apiCall('/api/planner/tasks');
    allTasks = res.tasks || [];
    updateTaskStats();
    renderTasks();
  } catch (err) {
    showToast('Failed to load study tasks', 'error');
  }
}

function updateTaskStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const pending = total - completed;

  document.getElementById('planner-total-tasks').textContent = total;
  document.getElementById('planner-completed-tasks').textContent = completed;
  document.getElementById('planner-pending-tasks').textContent = pending;
}

function filterPlannerTasks(filter) {
  currentFilter = filter;
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('planner-tasks-container');
  let filtered = allTasks;

  if (currentFilter === 'pending') filtered = allTasks.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = allTasks.filter(t => t.completed);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-muted);">
        <p>No study tasks in this view.</p>
        <button class="btn btn-secondary" style="margin-top:12px;font-size:12px;" onclick="openCreateTaskModal()">+ Add New Task</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const priorityTag = t.priority === 'high' ? 'tag-purple' : t.priority === 'medium' ? 'tag-cyan' : 'tag-green';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px solid var(--border-color);opacity:${t.completed ? '0.6' : '1'};">
        <div style="display:flex;align-items:center;gap:16px;flex:1;">
          <input type="checkbox" ${t.completed ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer;accent-color:var(--accent-cyan);" onchange="toggleTaskStatus('${t.id}', this.checked)">
          <div>
            <div style="font-weight:600;font-size:15px;color:#fff;text-decoration:${t.completed ? 'line-through' : 'none'};margin-bottom:4px;">
              ${escapeHtml(t.title)}
            </div>
            <div style="font-size:12px;color:var(--text-muted);display:flex;gap:10px;align-items:center;">
              <span class="tag ${priorityTag}">${(t.priority || 'medium').toUpperCase()}</span>
              <span>📚 ${escapeHtml(t.subject || 'General')}</span>
              <span>⏱️ ${t.duration_minutes || 30}m</span>
              <span>📅 Due: ${formatDate(t.due_date)}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-danger" style="padding:6px 10px;font-size:12px;" onclick="deleteTask('${t.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openCreateTaskModal() {
  document.getElementById('task-modal').classList.add('active');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
}

async function handleSaveTask(e) {
  e.preventDefault();
  const btn = document.getElementById('save-task-btn');
  btn.disabled = true;

  try {
    const title = document.getElementById('task-title').value.trim();
    const subject = document.getElementById('task-subject').value.trim();
    const priority = document.getElementById('task-priority').value;
    const due_date = document.getElementById('task-due-date').value;
    const duration_minutes = document.getElementById('task-duration').value;
    const description = document.getElementById('task-desc').value.trim();

    await apiCall('/api/planner/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, subject, priority, due_date, duration_minutes, description })
    });

    showToast('Task added to schedule! 🎉', 'success');
    closeTaskModal();
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    await loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function toggleTaskStatus(taskId, isCompleted) {
  try {
    await apiCall(`/api/planner/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: isCompleted ? 1 : 0 })
    });
    showToast(isCompleted ? 'Task marked complete! 🏆' : 'Task marked as pending', 'info');
    await loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to remove this study task?')) return;
  try {
    await apiCall(`/api/planner/tasks/${taskId}`, { method: 'DELETE' });
    showToast('Task removed', 'info');
    await loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
