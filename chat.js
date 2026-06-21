const aiProfiles = {
  vision: {
    name: 'Vision AI',
    badge: '01',
    subtitle: 'Image analysis, detection, and visual reasoning.',
    reply: (message) => `I am scanning the visual layer of your input. For "${message}", I would break the scene into shapes, contrast, motion, and object intent before responding.`
  },
  chat: {
    name: 'Chat AI',
    badge: '02',
    subtitle: 'Natural conversation with context awareness.',
    reply: (message) => `Understood. Here is a concise response to your request: ${message}. If you want, I can also expand this into a more detailed plan.`
  },
  code: {
    name: 'Code AI',
    badge: '03',
    subtitle: 'Programming support, debugging, and refactoring.',
    reply: (message) => `I can help structure that into code. For "${message}", I would first identify the inputs, outputs, edge cases, and then draft a clean implementation.`
  },
  audio: {
    name: 'Audio AI',
    badge: '04',
    subtitle: 'Voice, sound, and signal understanding.',
    reply: (message) => `I am tuning into the audio context behind "${message}" and would respond with rhythm, clarity, and signal-focused structure.`
  }
};

const params = new URLSearchParams(window.location.search);
const aiKey = aiProfiles[params.get('ai')] ? params.get('ai') : 'chat';
const profile = aiProfiles[aiKey];

const chatTitle = document.getElementById('chat-title');
const chatSubtitle = document.getElementById('chat-subtitle');
const chatBadge = document.getElementById('chat-badge');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

chatTitle.textContent = profile.name;
chatSubtitle.textContent = profile.subtitle;
chatBadge.textContent = profile.badge;

function addMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  const label = document.createElement('span');
  label.className = 'bubble-label';
  label.textContent = role === 'user' ? 'You' : profile.name;
  bubble.appendChild(label);
  bubble.appendChild(document.createTextNode(text));
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTyping() {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ai typing-bubble';
  bubble.dataset.typing = 'true';
  bubble.innerHTML = `<span class="bubble-label">${profile.name}</span>Thinking...`;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function seedChat() {
  addMessage('ai', `Welcome to ${profile.name}. Ask me anything and I will respond in this tab.`);
}

function autoResize() {
  chatInput.style.height = 'auto';
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 160)}px`;
}

chatInput.addEventListener('input', autoResize);
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage('user', message);
  chatInput.value = '';
  autoResize();

  const typingBubble = addTyping();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ai: aiKey, message })
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to get response from AI.');
      }
      return response.json();
    })
    .then((data) => {
      typingBubble.remove();
      addMessage('ai', data.reply || 'No response returned.');
    })
    .catch((error) => {
      typingBubble.remove();
      addMessage('ai', `Error: ${error.message}`);
    });
});

seedChat();
autoResize();