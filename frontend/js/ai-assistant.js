/* ═══════════════════════════════════════════════════════════════
   ai-assistant.js — Interactive AI Tutor Chat Logic
═══════════════════════════════════════════════════════════════ */

let chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const user = getUser();
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = 'flex';
  }
});

function formatMarkdown(text) {
  let formatted = escapeHtml(text);

  // Headers (### Header)
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="color:#fff;font-size:16px;margin:12px 0 6px 0;">$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="color:#fff;font-size:18px;margin:14px 0 8px 0;">$1</h2>');

  // Code blocks (```lang code ```)
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code (`code`)
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;color:var(--accent-cyan);font-family:monospace;">$1</code>');

  // Bold (**text**)
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

function scrollToBottom() {
  const box = document.getElementById('chat-messages-box');
  if (box) box.scrollTop = box.scrollHeight;
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('chat-input');
  input.value = promptText;
  handleSendChat(new Event('submit'));
}

function clearChatHistory() {
  chatHistory = [];
  const box = document.getElementById('chat-messages-box');
  box.innerHTML = `
    <div class="chat-bubble assistant">
      <div style="font-weight:700;color:var(--accent-cyan);margin-bottom:6px;">✨ AetherLearn AI Mentor</div>
      <p>Chat history cleared! Ask me anything to start a fresh discussion.</p>
    </div>
  `;
  showToast('Chat history cleared', 'info');
}

async function handleSendChat(e) {
  if (e && e.preventDefault) e.preventDefault();

  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  const box = document.getElementById('chat-messages-box');
  const btn = document.getElementById('chat-send-btn');

  // Append user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerHTML = escapeHtml(message);
  box.appendChild(userBubble);

  input.value = '';
  btn.disabled = true;
  btn.innerHTML = 'Thinking... ⏳';
  scrollToBottom();

  // Temporary loading bubble
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble assistant';
  loadingBubble.id = 'temp-loading-bubble';
  loadingBubble.innerHTML = '<span style="color:var(--accent-cyan);">Generating response... 🤖</span>';
  box.appendChild(loadingBubble);
  scrollToBottom();

  try {
    const res = await apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    loadingBubble.remove();

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble assistant';
    aiBubble.innerHTML = `
      <div style="font-weight:700;color:var(--accent-cyan);margin-bottom:6px;font-size:12px;">✨ AI Tutor</div>
      <div>${formatMarkdown(res.reply)}</div>
    `;
    box.appendChild(aiBubble);

    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: res.reply });

    scrollToBottom();

  } catch (err) {
    loadingBubble.remove();
    const errorBubble = document.createElement('div');
    errorBubble.className = 'chat-bubble assistant';
    errorBubble.style.borderColor = 'var(--accent-red)';
    errorBubble.innerHTML = `<span style="color:var(--accent-red);">Error: ${escapeHtml(err.message)}</span>`;
    box.appendChild(errorBubble);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Send 🚀';
    input.focus();
  }
}
