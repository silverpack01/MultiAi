const tabs = [
  { ai: 'vision', label: 'Vision AI', num: '01', accent: '#76f7ff' },
  { ai: 'chat',   label: 'Chat AI',   num: '02', accent: '#b68cff' },
  { ai: 'code',   label: 'Code AI',   num: '03', accent: '#68ffd1' },
  { ai: 'audio',  label: 'Audio AI',  num: '04', accent: '#ff7ad9' },
];

const orbitTrack = document.getElementById('orbit-track');

tabs.forEach((tab, i) => {
  const btn = document.createElement('button');
  btn.className = 'orbit-tab';
  btn.type = 'button';
  btn.dataset.ai = tab.ai;
  btn.style.cssText = `--i:${i}; --tab-accent:${tab.accent};`;
  btn.innerHTML = `
    <span class="tab-icon">${tab.num}</span>
    <span class="tab-label">${tab.label}</span>
  `;
  orbitTrack.appendChild(btn);
});

const orbitTabs = Array.from(orbitTrack.querySelectorAll('.orbit-tab'));

function updateOrbitMotion() {
  const angle = (performance.now() * 0.02) % 360;

  orbitTrack.style.transform = 'none';

  orbitTabs.forEach((tab, index) => {
    const deg = angle + index * 90;
    const rad = (deg * Math.PI) / 180;
    const radius = 185;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    tab.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  });

  requestAnimationFrame(updateOrbitMotion);
}

requestAnimationFrame(updateOrbitMotion);

orbitTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const ai = tab.dataset.ai || 'chat';
    window.location.href = `chat.html?ai=${encodeURIComponent(ai)}`;
  });
});