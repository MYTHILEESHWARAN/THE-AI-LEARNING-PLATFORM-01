/* ═══════════════════════════════════════════════════════════════
   ai-assistant.js — Interactive AI Mentor Conversational Engine
   AetherLearn AI Platform
═══════════════════════════════════════════════════════════════ */

let chatHistory = [];
let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
  if (!authGuard()) return;

  generateStars(60);
  setupSidebar();

  const user = getUser();
  if (user.role === 'admin') {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.style.display = 'flex';
  }

  setupComposerTextarea();
  setupGlobalClickHandlers();
});

/* ─── Auto-expanding Textarea & Keyboard Shortcuts ──────────── */
function setupComposerTextarea() {
  const textarea = document.getElementById('chat-input');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitUserChat();
    }
  });
}

/* ─── Global Click Handlers (Close dropdowns) ────────────────── */
function setupGlobalClickHandlers() {
  document.addEventListener('click', (e) => {
    const snippetMenu = document.getElementById('snippet-menu');
    const snippetBtn = document.getElementById('composer-code-btn');
    if (snippetMenu && !snippetMenu.classList.contains('hidden')) {
      if (!snippetMenu.contains(e.target) && (!snippetBtn || !snippetBtn.contains(e.target))) {
        snippetMenu.classList.add('hidden');
      }
    }
  });
}

/* ─── Toggle Code Snippet Menu ───────────────────────────────── */
function toggleSnippetMenu() {
  const menu = document.getElementById('snippet-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

/* ─── Insert Starter Code Snippet ────────────────────────────── */
function insertCodeSnippet(type) {
  const textarea = document.getElementById('chat-input');
  if (!textarea) return;

  const templates = {
    python: '```python\ndef solve_problem(input_data):\n    # TODO: Implement algorithm\n    return input_data\n\n# Test run\nprint(solve_problem("test"))\n```\n',
    javascript: '```javascript\nfunction processData(items) {\n    // TODO: Implement solution\n    return items.map(item => item);\n}\n\nconsole.log(processData([1, 2, 3]));\n```\n',
    java: '```java\npublic class Solution {\n    public static void main(String[] args) {\n        // TODO: Implement logic\n        System.out.println("Ready to learn!");\n    }\n}\n```\n',
    sql: '```sql\n-- Query template\nSELECT id, name, created_at\nFROM learners\nWHERE status = \'active\'\nORDER BY created_at DESC;\n```\n',
    generic: '```text\n// Paste your code or error stack trace here\n```\n'
  };

  const code = templates[type] || templates.generic;
  const startPos = textarea.selectionStart || 0;
  const endPos = textarea.selectionEnd || 0;
  const currentVal = textarea.value;

  textarea.value = currentVal.substring(0, startPos) + code + currentVal.substring(endPos);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = startPos + code.length;

  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';

  const menu = document.getElementById('snippet-menu');
  if (menu) menu.classList.add('hidden');
}

/* ─── Format Time Helper ─────────────────────────────────────── */
function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── Professional Markdown Parser ───────────────────────────── */
function formatMarkdown(text) {
  if (!text) return '';

  // 1. Separate code blocks to protect them from regex mangling
  const codeBlocks = [];
  let processed = text.replace(/```([a-zA-Z0-9_\-\+\#]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({
      lang: (lang || 'code').trim().toLowerCase(),
      code: code.replace(/^\n+|\n+$/g, '')
    });
    return placeholder;
  });

  // 2. Escape HTML on text content
  processed = escapeHtml(processed);

  // 3. Headings
  processed = processed.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  processed = processed.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  processed = processed.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // 4. Bold and Italics
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 5. Inline code
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 6. Lists
  // Unordered lists (- or *)
  processed = processed.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  processed = processed.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // 7. Paragraphs and line breaks
  const lines = processed.split('\n');
  const renderedLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) { renderedLines.push('</ul>'); inList = false; }
      continue;
    }

    if (line.startsWith('<li>')) {
      if (!inList) {
        renderedLines.push('<ul>');
        inList = true;
      }
      renderedLines.push(line);
    } else {
      if (inList) {
        renderedLines.push('</ul>');
        inList = false;
      }
      if (line.startsWith('<h1') || line.startsWith('<h2') || line.startsWith('<h3') || line.startsWith('__CODE_BLOCK_')) {
        renderedLines.push(line);
      } else {
        renderedLines.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) renderedLines.push('</ul>');

  processed = renderedLines.join('\n');

  // 8. Re-insert Code Blocks with Professional Card UI
  codeBlocks.forEach((block, idx) => {
    const rawCode = block.code;
    const escapedCode = escapeHtml(rawCode);
    const langDisplay = block.lang.toUpperCase() || 'CODE';
    const langClass = block.lang || 'text';

    // Base64 encode code for safe copy attribute
    const encodedForCopy = encodeURIComponent(rawCode);

    const blockHtml = `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <div class="code-block-lang">
            <span>&lt;/&gt;</span>
            <span>${langDisplay}</span>
          </div>
          <button type="button" class="code-copy-btn" data-code="${encodedForCopy}" onclick="copyCodeSnippet(this)" title="Copy code to clipboard">
            <span class="copy-icon">📋</span>
            <span class="copy-label">Copy Code</span>
          </button>
        </div>
        <div class="code-block-body">
          <pre><code class="language-${langClass}">${escapedCode}</code></pre>
        </div>
      </div>
    `;

    processed = processed.replace(`__CODE_BLOCK_${idx}__`, blockHtml);
  });

  return processed;
}

/* ─── Copy Code to Clipboard ─────────────────────────────────── */
async function copyCodeSnippet(btn) {
  try {
    const encodedCode = btn.getAttribute('data-code') || '';
    const rawCode = decodeURIComponent(encodedCode);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(rawCode);
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = rawCode;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }

    const label = btn.querySelector('.copy-label');
    const icon = btn.querySelector('.copy-icon');
    const originalText = label ? label.textContent : 'Copy Code';

    if (label) label.textContent = 'Copied! ✓';
    if (icon) icon.textContent = '✓';
    btn.classList.add('copied');

    setTimeout(() => {
      if (label) label.textContent = originalText;
      if (icon) icon.textContent = '📋';
      btn.classList.remove('copied');
    }, 2000);

  } catch (err) {
    showToast('Failed to copy code to clipboard', 'error');
  }
}

/* ─── Smooth Scroll to Bottom ────────────────────────────────── */
function scrollToBottom() {
  const container = document.getElementById('chat-scroll-container');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

/* ─── Suggestion Card Click ──────────────────────────────────── */
function handleSuggestionClick(promptText) {
  const input = document.getElementById('chat-input');
  if (!input) return;
  input.value = promptText;
  submitUserChat();
}

/* ─── Quick Prompt Function (Backwards Compatibility) ────────── */
function sendQuickPrompt(promptText) {
  handleSuggestionClick(promptText);
}

/* ─── Clear Chat History ─────────────────────────────────────── */
function clearChatHistory() {
  chatHistory = [];
  const messagesBox = document.getElementById('chat-messages-box');
  const emptyState = document.getElementById('chat-empty-state');
  const input = document.getElementById('chat-input');

  if (messagesBox) {
    messagesBox.innerHTML = '';
    messagesBox.style.display = 'none';
  }

  if (emptyState) {
    emptyState.style.display = 'flex';
  }

  if (input) {
    input.value = '';
    input.style.height = 'auto';
  }

  showToast('Chat history cleared. Ready for a new discussion!', 'info');
}

/* ─── Append User Message Bubble ─────────────────────────────── */
function appendUserMessage(message) {
  const messagesBox = document.getElementById('chat-messages-box');
  const emptyState = document.getElementById('chat-empty-state');

  if (emptyState) emptyState.style.display = 'none';
  if (messagesBox) messagesBox.style.display = 'flex';

  const user = getUser();
  const userName = user.name || 'You';
  const userInitial = userName.charAt(0).toUpperCase() || 'U';
  const timeStr = getCurrentTimeString();

  const userRow = document.createElement('div');
  userRow.className = 'message-row user-row';
  userRow.innerHTML = `
    <div class="user-bubble">
      <div class="user-header">
        <span class="user-tag">You</span>
        <span class="user-time">${timeStr}</span>
      </div>
      <div class="user-text">${escapeHtml(message)}</div>
    </div>
    <div class="user-avatar-badge">${escapeHtml(userInitial)}</div>
  `;

  messagesBox.appendChild(userRow);
  scrollToBottom();
}

/* ─── Show / Remove Typing Indicator ─────────────────────────── */
function showTypingIndicator() {
  const messagesBox = document.getElementById('chat-messages-box');
  if (!messagesBox) return;

  const typingRow = document.createElement('div');
  typingRow.className = 'message-row ai-row';
  typingRow.id = 'temp-loading-bubble';
  typingRow.innerHTML = `
    <div class="ai-avatar-badge">✨</div>
    <div class="ai-bubble typing-bubble">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="typing-text">Thinking & synthesizing response...</span>
    </div>
  `;

  messagesBox.appendChild(typingRow);
  scrollToBottom();
}

function removeTypingIndicator() {
  const loadingBubble = document.getElementById('temp-loading-bubble');
  if (loadingBubble) loadingBubble.remove();
}

/* ─── Append AI Message Bubble ───────────────────────────────── */
function appendAiMessage(replyText) {
  const messagesBox = document.getElementById('chat-messages-box');
  if (!messagesBox) return;

  const timeStr = getCurrentTimeString();
  const formattedContent = formatMarkdown(replyText);

  const aiRow = document.createElement('div');
  aiRow.className = 'message-row ai-row';
  aiRow.innerHTML = `
    <div class="ai-avatar-badge">✨</div>
    <div class="ai-bubble">
      <div class="ai-header">
        <span class="ai-sender-name">AetherLearn AI Mentor</span>
        <span class="ai-badge">Tutor</span>
        <span class="ai-time">${timeStr}</span>
      </div>
      <div class="ai-content">
        ${formattedContent}
      </div>
    </div>
  `;

  messagesBox.appendChild(aiRow);
  scrollToBottom();
}

/* ─── Append Error Message Bubble ────────────────────────────── */
function appendErrorMessage(errText) {
  const messagesBox = document.getElementById('chat-messages-box');
  if (!messagesBox) return;

  const timeStr = getCurrentTimeString();
  const errorRow = document.createElement('div');
  errorRow.className = 'message-row ai-row';
  errorRow.innerHTML = `
    <div class="ai-avatar-badge" style="background:linear-gradient(135deg,#ff4d6d,#ff758c);">⚠️</div>
    <div class="ai-bubble" style="border-color:rgba(255,77,109,0.4);background:rgba(26,10,20,0.85);">
      <div class="ai-header">
        <span class="ai-sender-name" style="color:#ff6b8b;">Mentor System Notice</span>
        <span class="ai-badge" style="color:#ff4d6d;border-color:rgba(255,77,109,0.4);">Notice</span>
        <span class="ai-time">${timeStr}</span>
      </div>
      <div class="ai-content" style="color:#ffc2cd;">
        <p>${escapeHtml(errText)}</p>
      </div>
    </div>
  `;

  messagesBox.appendChild(errorRow);
  scrollToBottom();
}

/* ─── Submit User Chat ───────────────────────────────────────── */
async function submitUserChat() {
  if (isGenerating) return;

  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send-btn');
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  // Clear and reset textarea height
  input.value = '';
  input.style.height = 'auto';

  // Append user bubble
  appendUserMessage(message);

  // Set loading state
  isGenerating = true;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span>';
  }

  showTypingIndicator();

  try {
    const res = await apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    removeTypingIndicator();

    if (res && res.reply) {
      appendAiMessage(res.reply);
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'assistant', content: res.reply });
    } else {
      appendErrorMessage('No response received from the tutor service. Please try again.');
    }

  } catch (err) {
    removeTypingIndicator();
    appendErrorMessage(`Could not reach the AI Mentor: ${err.message || 'Network error'}. Please verify your connection.`);
  } finally {
    isGenerating = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🚀</span>';
    }
    input.focus();
  }
}

// Preserve backwards-compatible handleSendChat
function handleSendChat(e) {
  if (e && e.preventDefault) e.preventDefault();
  submitUserChat();
}
