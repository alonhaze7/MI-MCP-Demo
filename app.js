// MI Data Pipelines MCP Demo — Application Logic

let currentScenario = null;
let isPlaying = false;
let stepIndex = 0;

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const toolsPanel = document.getElementById('toolsPanel');
const panelContent = document.getElementById('panelContent');
const rightPanel = document.getElementById('rightPanel');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Scenario buttons (sidebar)
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.dataset.scenario;
      startScenario(scenario);
    });
  });

  // Welcome cards
  document.querySelectorAll('.welcome-card').forEach(card => {
    card.addEventListener('click', () => {
      const scenario = card.dataset.scenario;
      startScenario(scenario);
    });
  });

  // Send button
  sendBtn.addEventListener('click', handleSend);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Panel close
  document.getElementById('panelClose').addEventListener('click', () => {
    rightPanel.classList.toggle('hidden');
  });

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });
});

function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  // Try to match to a scenario
  const matchedScenario = matchScenario(text);
  if (matchedScenario) {
    userInput.value = '';
    userInput.style.height = 'auto';
    startScenario(matchedScenario);
  } else {
    // Generic response for unmatched input
    userInput.value = '';
    userInput.style.height = 'auto';
    hideWelcome();
    addMessage('user', text);
    setTimeout(() => {
      addMessage('assistant', `<p>I can help with that! In this demo, try one of these scenarios:</p>
        <p>• "Acme's Meta spend dropped to zero" — Discovery & Fix<br>
        • "Connect LinkedIn Ads to Acme" — Set Up Connector<br>
        • "Are any connections not feeding data?" — Find Orphans<br>
        • "Refresh the last 7 days" — Reprocess Data<br>
        • "Backfill 90 days for Initech" — Backfill History<br>
        • "What's going to break?" — Break Prevention<br>
        • "Does anything look double-counted?" — Duplicate Detection</p>
        <p>Or click a use case in the sidebar to see the full interactive walkthrough.</p>`);
    }, 500);
  }
}

function matchScenario(text) {
  const lower = text.toLowerCase();
  if (lower.includes('spend') || lower.includes('dropped') || lower.includes('zero') || lower.includes('deviation')) return 'discovery';
  if (lower.includes('connect') || lower.includes('linkedin') || lower.includes('set up')) return 'connector';
  if (lower.includes('orphan') || lower.includes('not feeding') || lower.includes('not wired')) return 'orphans';
  if (lower.includes('stale') || lower.includes('refresh') || lower.includes('reprocess') || lower.includes('attribution')) return 'reprocess';
  if (lower.includes('backfill') || lower.includes('history') || lower.includes('90 days')) return 'backfill';
  if (lower.includes('break') || lower.includes('prevention') || lower.includes('expire') || lower.includes('going to')) return 'prevention';
  if (lower.includes('double') || lower.includes('duplicate') || lower.includes('overlap')) return 'duplicates';
  return null;
}

function startScenario(scenarioKey) {
  if (isPlaying) return;

  currentScenario = SCENARIOS[scenarioKey];
  if (!currentScenario) return;

  // Update sidebar active state
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scenario === scenarioKey);
  });

  // Reset state
  isPlaying = true;
  stepIndex = 0;
  hideWelcome();
  clearMessages();
  clearPanel();
  updateToolsPanel(currentScenario.tools);

  // Show user message
  addMessage('user', currentScenario.userMessage);

  // Start playing steps after a brief delay
  setTimeout(() => playSteps(currentScenario.steps), 800);
}

function hideWelcome() {
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }
}

function clearMessages() {
  // Remove all messages but keep welcome (hidden)
  const messages = messagesContainer.querySelectorAll('.message, .typing-wrapper');
  messages.forEach(m => m.remove());
}

function clearPanel() {
  panelContent.innerHTML = '<div class="panel-empty"><p>Tool calls will appear here as the agent works...</p></div>';
}

function updateToolsPanel(tools) {
  toolsPanel.innerHTML = tools.map(t =>
    `<span class="tool-tag" data-tool="${t}">${t}</span>`
  ).join('');
}

function markToolCalled(toolName) {
  const tag = toolsPanel.querySelector(`[data-tool="${toolName}"]`);
  if (tag) {
    tag.classList.add('called');
  }
}

async function playSteps(steps) {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (step.type === 'thinking') {
      await showThinking(step.content);
    } else if (step.type === 'tool') {
      await showToolCall(step);
    } else if (step.type === 'response') {
      await showResponse(step.content);
    } else if (step.type === 'approval_response') {
      // This will be triggered by the approval button
      window._pendingApproval = step;
      isPlaying = false;
      return;
    }

    await delay(300);
  }

  isPlaying = false;
}

function showThinking(content) {
  return new Promise(resolve => {
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant';
    wrapper.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(wrapper);
    scrollToBottom();

    setTimeout(() => {
      wrapper.querySelector('.message-content').innerHTML = `<p style="color: var(--text-muted); font-style: italic; font-size: 13px;">💭 ${content}</p>`;
      scrollToBottom();
      resolve();
    }, 1200);
  });
}

function showToolCall(step) {
  return new Promise(resolve => {
    // Add to right panel
    addToolLogEntry(step.name, step.params, 'running');

    // Add inline tool call
    const toolBlock = document.createElement('div');
    toolBlock.className = 'message assistant';
    toolBlock.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="tool-call">
          <div class="tool-call-header">
            <span class="tool-call-icon running">⚙️</span>
            <span class="tool-call-name">${step.name}</span>
            <span class="tool-call-status running">running</span>
          </div>
          <div class="tool-call-body">${step.params}</div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(toolBlock);
    scrollToBottom();

    // Simulate execution time
    setTimeout(() => {
      const header = toolBlock.querySelector('.tool-call-header');
      const status = toolBlock.querySelector('.tool-call-status');
      const icon = toolBlock.querySelector('.tool-call-icon');
      const body = toolBlock.querySelector('.tool-call-body');

      icon.classList.remove('running');
      icon.textContent = '✓';
      status.classList.remove('running');
      status.classList.add('success');
      status.textContent = 'success';
      body.innerHTML += `\n\n<span style="color: var(--success)">→ Result:</span>\n${step.result}`;

      // Update panel
      updateToolLogEntry(step.name, 'success');
      markToolCalled(step.name);
      scrollToBottom();
      resolve();
    }, 1500 + Math.random() * 1000);
  });
}

function showResponse(content) {
  return new Promise(resolve => {
    // Show typing first
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant';
    wrapper.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(wrapper);
    scrollToBottom();

    setTimeout(() => {
      wrapper.querySelector('.message-content').innerHTML = content;
      scrollToBottom();
      resolve();
    }, 1000);
  });
}

function addMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  if (role === 'user') {
    wrapper.innerHTML = `
      <div class="message-avatar">👤</div>
      <div class="message-content">${content}</div>
    `;
  } else {
    wrapper.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">${content}</div>
    `;
  }

  messagesContainer.appendChild(wrapper);
  scrollToBottom();
}

function addToolLogEntry(name, params, status) {
  // Remove empty state
  const empty = panelContent.querySelector('.panel-empty');
  if (empty) empty.remove();

  const entry = document.createElement('div');
  entry.className = `tool-log-entry ${status}`;
  entry.dataset.tool = name;
  entry.innerHTML = `
    <div class="tool-log-name">${status === 'running' ? '⏳' : '✓'} ${name}</div>
    <div class="tool-log-detail">${params.substring(0, 80)}...</div>
    <div class="tool-log-time">${new Date().toLocaleTimeString()}</div>
  `;
  panelContent.appendChild(entry);
  panelContent.scrollTop = panelContent.scrollHeight;
}

function updateToolLogEntry(name, status) {
  const entries = panelContent.querySelectorAll('.tool-log-entry');
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].dataset.tool === name) {
      entries[i].classList.remove('running');
      entries[i].classList.add(status);
      entries[i].querySelector('.tool-log-name').innerHTML = `✓ ${name}`;
      break;
    }
  }
}

// Handle approval button clicks
window.handleApproval = async function(scenarioKey) {
  if (!window._pendingApproval) return;

  const approval = window._pendingApproval;
  window._pendingApproval = null;
  isPlaying = true;

  // Disable the buttons
  const buttons = document.querySelectorAll('.action-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'default';
  });

  // Add user approval message
  addMessage('user', '✓ Approved — go ahead.');

  await delay(500);

  // Play approval steps
  for (const step of approval.steps) {
    if (step.type === 'tool') {
      await showToolCall(step);
    }
    await delay(300);
  }

  // Show final response
  await showResponse(approval.finalResponse);
  isPlaying = false;
};

window.handlePreview = function(scenarioKey) {
  // Show a preview diff in the panel
  const diffContent = `<div class="tool-log-entry info">
    <div class="tool-log-name">📋 Mapping Diff Preview</div>
    <div class="tool-log-detail" style="white-space:pre; font-family: var(--font-mono);">
- source: "spend"        → target: "Cost"
+ source: "amount_spent" → target: "Cost"

No other mappings affected.
    </div>
  </div>`;

  const empty = panelContent.querySelector('.panel-empty');
  if (empty) empty.remove();
  panelContent.insertAdjacentHTML('beforeend', diffContent);
};

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
