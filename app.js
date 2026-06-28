// MI Data Pipelines MCP Demo — Step-by-Step Interactive App
// Note: All content rendered is static/hardcoded demo data — no user input is rendered unsanitized.

let currentScenarioKey = null;
let currentScenario = null;
let visibleStepIndex = -1;
let totalSteps = 0;
let autoPlaying = false;
let autoPlayTimer = null;

// DOM refs
const chatContainer = document.getElementById('chatContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const stepCounter = document.getElementById('stepCounter');
const stepDescription = document.getElementById('stepDescription');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const autoPlayBtn = document.getElementById('autoPlayBtn');
const resetBtn = document.getElementById('resetBtn');
const userPromptBlock = document.getElementById('userPromptBlock');
const thinkingSection = document.getElementById('thinkingSection');
const thinkingBlock = document.getElementById('thinkingBlock');
const toolsTimeline = document.getElementById('toolsTimeline');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Sidebar scenarios
  document.querySelectorAll('.scenario-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { loadScenario(btn.dataset.scenario); });
  });
  // Welcome cards
  document.querySelectorAll('.welcome-card').forEach(function(card) {
    card.addEventListener('click', function() { loadScenario(card.dataset.scenario); });
  });
  // Step controls
  nextBtn.addEventListener('click', nextStep);
  prevBtn.addEventListener('click', prevStep);
  autoPlayBtn.addEventListener('click', toggleAutoPlay);
  resetBtn.addEventListener('click', resetScenario);
  // Inspector tabs
  document.querySelectorAll('.inspector-tab').forEach(function(tab) {
    tab.addEventListener('click', function() { switchInspectorTab(tab.dataset.tab); });
  });
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextStep(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevStep(); }
  });
});

// --- Scenario Loading ---

function loadScenario(key) {
  stopAutoPlay();
  currentScenarioKey = key;
  currentScenario = SCENARIOS[key];
  if (!currentScenario) return;

  currentScenario._flatSteps = buildFlatSteps(currentScenario);
  totalSteps = currentScenario._flatSteps.length;
  visibleStepIndex = -1;

  document.querySelectorAll('.scenario-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.scenario === key);
  });

  userPromptBlock.textContent = currentScenario.userMessage;
  thinkingSection.style.display = 'none';
  toolsTimeline.textContent = '';
  var emptyMsg = document.createElement('div');
  emptyMsg.className = 'timeline-empty';
  emptyMsg.textContent = 'Click "Next" to step through';
  toolsTimeline.appendChild(emptyMsg);

  nextBtn.disabled = false;
  autoPlayBtn.disabled = false;
  resetBtn.disabled = false;
  prevBtn.disabled = true;

  welcomeScreen.style.display = 'none';
  renderChat();
  updateStepBar();
}

function buildFlatSteps(scenario) {
  var flat = [];
  flat.push({ type: 'user', content: scenario.userMessage, description: 'User sends request' });

  for (var s = 0; s < scenario.steps.length; s++) {
    var step = scenario.steps[s];
    if (step.type === 'thinking') {
      flat.push({ type: 'thinking', content: step.content, description: 'Agent reasoning' });
    } else if (step.type === 'tool') {
      flat.push({ type: 'tool', name: step.name, params: step.params, result: step.result, status: step.status, description: 'Tool: ' + step.name });
    } else if (step.type === 'response') {
      flat.push({ type: 'response', content: step.content, description: 'Agent response' });
    } else if (step.type === 'approval_response') {
      flat.push({ type: 'approval', description: 'User approves action' });
      for (var a = 0; a < step.steps.length; a++) {
        var sub = step.steps[a];
        if (sub.type === 'tool') {
          flat.push({ type: 'tool', name: sub.name, params: sub.params, result: sub.result, status: sub.status, description: 'Tool: ' + sub.name });
        }
      }
      flat.push({ type: 'final_response', content: step.finalResponse, description: 'Final result' });
    }
  }
  return flat;
}

// --- Step Navigation ---

function nextStep() {
  if (!currentScenario || visibleStepIndex >= totalSteps - 1) return;
  visibleStepIndex++;
  renderChat();
  updateStepBar();
  updateInspector();
  prevBtn.disabled = visibleStepIndex <= 0;
  nextBtn.disabled = visibleStepIndex >= totalSteps - 1;
  if (visibleStepIndex >= totalSteps - 1) stopAutoPlay();
}

function prevStep() {
  if (!currentScenario || visibleStepIndex <= 0) return;
  visibleStepIndex--;
  renderChat();
  updateStepBar();
  updateInspector();
  prevBtn.disabled = visibleStepIndex <= 0;
  nextBtn.disabled = false;
}

function resetScenario() {
  stopAutoPlay();
  if (currentScenarioKey) loadScenario(currentScenarioKey);
}

function toggleAutoPlay() {
  if (autoPlaying) {
    stopAutoPlay();
  } else {
    autoPlaying = true;
    autoPlayBtn.textContent = '⏸ Pause';
    autoAdvance();
  }
}

function stopAutoPlay() {
  autoPlaying = false;
  if (autoPlayTimer) clearTimeout(autoPlayTimer);
  autoPlayTimer = null;
  autoPlayBtn.textContent = '▶ Auto';
}

function autoAdvance() {
  if (!autoPlaying || visibleStepIndex >= totalSteps - 1) { stopAutoPlay(); return; }
  nextStep();
  var step = currentScenario._flatSteps[visibleStepIndex];
  var delay = 1200;
  if (step.type === 'tool') delay = 2000;
  if (step.type === 'response' || step.type === 'final_response') delay = 2500;
  autoPlayTimer = setTimeout(autoAdvance, delay);
}

function updateStepBar() {
  if (!currentScenario) {
    stepCounter.textContent = '';
    stepDescription.textContent = 'Select a scenario to begin';
    return;
  }
  var current = visibleStepIndex + 1;
  stepCounter.textContent = current + ' / ' + totalSteps;
  if (visibleStepIndex >= 0) {
    stepDescription.textContent = currentScenario._flatSteps[visibleStepIndex].description;
  } else {
    stepDescription.textContent = 'Ready — click Next or press →';
  }
}

// --- Rendering ---

function renderChat() {
  var existing = chatContainer.querySelectorAll('.message');
  existing.forEach(function(el) { el.remove(); });

  if (!currentScenario || visibleStepIndex < 0) return;

  var steps = currentScenario._flatSteps;
  var toolCallNum = 0;

  for (var i = 0; i <= visibleStepIndex; i++) {
    var step = steps[i];
    var el = document.createElement('div');
    el.className = 'message';

    if (step.type === 'user') {
      renderUserMessage(el, step.content);
    } else if (step.type === 'thinking') {
      renderThinking(el, step.content);
    } else if (step.type === 'tool') {
      toolCallNum++;
      renderToolCall(el, step, toolCallNum, i === visibleStepIndex);
    } else if (step.type === 'response' || step.type === 'final_response') {
      renderAssistantResponse(el, step.content);
    } else if (step.type === 'approval') {
      renderUserMessage(el, '✓ Approved — go ahead.');
    }

    chatContainer.appendChild(el);
  }

  requestAnimationFrame(function() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

function renderUserMessage(el, text) {
  var header = document.createElement('div');
  header.className = 'msg-header';
  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar user';
  avatar.textContent = 'Y';
  var name = document.createElement('span');
  name.className = 'msg-name';
  name.textContent = 'You';
  header.appendChild(avatar);
  header.appendChild(name);

  var body = document.createElement('div');
  body.className = 'msg-body';
  var p = document.createElement('p');
  p.textContent = text;
  body.appendChild(p);

  el.appendChild(header);
  el.appendChild(body);
}

function renderThinking(el, text) {
  var header = document.createElement('div');
  header.className = 'msg-header';
  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar assistant';
  avatar.textContent = '●';
  avatar.style.color = '#D4A574';
  avatar.style.fontSize = '16px';
  var name = document.createElement('span');
  name.className = 'msg-name';
  name.textContent = 'Claude';
  var time = document.createElement('span');
  time.className = 'msg-time';
  time.textContent = 'thinking...';
  header.appendChild(avatar);
  header.appendChild(name);
  header.appendChild(time);

  var body = document.createElement('div');
  body.className = 'msg-body';
  var block = document.createElement('div');
  block.className = 'thinking-block-inline';
  block.textContent = text;
  body.appendChild(block);

  el.appendChild(header);
  el.appendChild(body);
}

function renderToolCall(el, step, num, isLatest) {
  var header = document.createElement('div');
  header.className = 'msg-header';
  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar assistant';
  avatar.textContent = '●';
  avatar.style.color = '#D4A574';
  avatar.style.fontSize = '16px';
  var name = document.createElement('span');
  name.className = 'msg-name';
  name.textContent = 'Claude';
  var time = document.createElement('span');
  time.className = 'msg-time';
  time.textContent = 'tool call #' + num;
  header.appendChild(avatar);
  header.appendChild(name);
  header.appendChild(time);

  var body = document.createElement('div');
  body.className = 'msg-body';

  var toolBlock = document.createElement('div');
  toolBlock.className = 'tool-block';

  // Tool header
  var toolHeader = document.createElement('div');
  toolHeader.className = 'tool-header';
  var icon = document.createElement('span');
  icon.className = isLatest ? 'tool-icon spinning' : 'tool-icon';
  icon.textContent = isLatest ? '⚙' : '✓';
  var toolName = document.createElement('span');
  toolName.className = 'tool-name';
  toolName.textContent = step.name + '()';
  var status = document.createElement('span');
  status.className = 'tool-status ' + (isLatest ? 'running' : 'success');
  status.textContent = isLatest ? 'executing...' : 'completed';
  toolHeader.appendChild(icon);
  toolHeader.appendChild(toolName);
  toolHeader.appendChild(status);

  // Params
  var params = document.createElement('div');
  params.className = 'tool-params';
  params.textContent = step.params;

  toolBlock.appendChild(toolHeader);
  toolBlock.appendChild(params);

  // Result (show for completed steps)
  if (!isLatest) {
    var result = document.createElement('div');
    result.className = 'tool-result';
    var label = document.createElement('span');
    label.className = 'tool-result-label';
    label.textContent = '← Response';
    result.appendChild(label);
    result.appendChild(document.createTextNode('\n' + step.result));
    toolBlock.appendChild(result);
  }

  body.appendChild(toolBlock);
  el.appendChild(header);
  el.appendChild(body);
}

function renderAssistantResponse(el, content) {
  var header = document.createElement('div');
  header.className = 'msg-header';
  var avatar = document.createElement('div');
  avatar.className = 'msg-avatar assistant';
  avatar.textContent = '●';
  avatar.style.color = '#D4A574';
  avatar.style.fontSize = '16px';
  var name = document.createElement('span');
  name.className = 'msg-name';
  name.textContent = 'Claude';
  header.appendChild(avatar);
  header.appendChild(name);

  var body = document.createElement('div');
  body.className = 'msg-body';
  // Content from scenarios is trusted static HTML defined in scenarios.js
  // This is a demo with no user-generated content — all data is hardcoded
  body.innerHTML = content; // eslint-disable-line -- static demo content only

  el.appendChild(header);
  el.appendChild(body);
}

// --- Inspector Updates ---

function updateInspector() {
  if (!currentScenario || visibleStepIndex < 0) return;
  var step = currentScenario._flatSteps[visibleStepIndex];

  if (step.type === 'thinking') {
    thinkingSection.style.display = 'block';
    thinkingBlock.textContent = step.content;
  }

  if (step.type === 'tool') {
    var empty = toolsTimeline.querySelector('.timeline-empty');
    if (empty) empty.remove();

    var item = document.createElement('div');
    item.className = 'timeline-item';

    var itemName = document.createElement('div');
    itemName.className = 'timeline-item-name';
    itemName.textContent = step.name + '()';

    var itemDetail = document.createElement('div');
    itemDetail.className = 'timeline-item-detail';
    itemDetail.textContent = step.params.substring(0, 50).trim() + '...';

    var itemTime = document.createElement('div');
    itemTime.className = 'timeline-item-time';
    itemTime.textContent = 'Step ' + (visibleStepIndex + 1);

    item.appendChild(itemName);
    item.appendChild(itemDetail);
    item.appendChild(itemTime);
    toolsTimeline.appendChild(item);

    if (toolsTimeline.children.length === 1) {
      switchInspectorTab('tools');
    }
  }
}

function switchInspectorTab(tab) {
  document.querySelectorAll('.inspector-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('promptPane').classList.toggle('active', tab === 'prompt');
  document.getElementById('contextPane').classList.toggle('active', tab === 'context');
  document.getElementById('toolsPane').classList.toggle('active', tab === 'tools');
}
