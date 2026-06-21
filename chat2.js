const ai = new URLSearchParams(window.location.search).get('ai') || 'chat';

const aiMeta = {
  vision: { label: 'Vision AI', num: '01', accent: '#76f7ff' },
  chat:   { label: 'Chat AI',   num: '02', accent: '#b68cff' },
  code:   { label: 'Code AI',   num: '03', accent: '#68ffd1' },
  audio:  { label: 'Audio AI',  num: '04', accent: '#ff7ad9' },
};

const meta = aiMeta[ai] || aiMeta.chat;

document.querySelector('.chat-ai-title').textContent = meta.label;
document.querySelector('.chat-ai-badge').textContent = meta.num;
document.querySelector('.chat-ai-badge').style.setProperty('--tab-accent', meta.accent);

const messagesEl = document.getElementById('chat-messages');
const inputEl = document.getElementById('chat-input');
const formEl = document.getElementById('chat-form');
const clearBtn = document.getElementById('clear-btn');

document.getElementById('chat-title').textContent = meta.label;
document.getElementById('chat-badge').textContent = meta.num;
document.getElementById('chat-badge').style.setProperty('--tab-accent', meta.accent);
document.getElementById('chat-subtitle').textContent = meta.label + ' ready.';

function saveHistory(messages) {
  localStorage.setItem(`chat_history_${ai}`, JSON.stringify(messages));
}

function loadHistory() {
  const saved = localStorage.getItem(`chat_history_${ai}`);
  return saved ? JSON.parse(saved) : [];
}

function renderBubble(role, content) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role === 'user' ? 'user' : 'ai'}`;
  div.innerHTML = `<span class="bubble-label">${role === 'user' ? 'You' : meta.label}</span>${content}`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

let messages = loadHistory();
messages.forEach(m => renderBubble(m.role, m.content));

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = '';
  renderBubble('user', message);
  messages.push({ role: 'user', content: message });
  saveHistory(messages);

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-bubble ai';
  loadingDiv.innerHTML = `<span class="bubble-label">${meta.label}</span>...`;
  messagesEl.appendChild(loadingDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai, message, history: messages.slice(0, -1) }),
    });

    const data = await res.json();
    const reply = data.reply || data.error || 'Something went wrong.';

    loadingDiv.innerHTML = `<span class="bubble-label">${meta.label}</span>${reply}`;
    messages.push({ role: 'assistant', content: reply });
    saveHistory(messages);
  } catch {
    loadingDiv.innerHTML = `<span class="bubble-label">${meta.label}</span>Network error.`;
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
});

clearBtn.addEventListener('click', () => {
  localStorage.removeItem(`chat_history_${ai}`);
  messages = [];
  messagesEl.innerHTML = '';
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    formEl.dispatchEvent(new Event('submit'));
  }
});