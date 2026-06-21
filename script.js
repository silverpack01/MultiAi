const orbitTrack = document.getElementById('orbit-track');
const orbitTabs = Array.from(document.querySelectorAll('.orbit-tab'));

function updateOrbitMotion() {
  const baseRotation = (performance.now() * 0.016) % 360;
  orbitTrack.style.transform = `rotate(${baseRotation}deg)`;

  orbitTabs.forEach((tab, index) => {
    const offset = index * 90;
    const wobble = Math.sin((performance.now() / 700) + index) * 5;
    tab.style.transform = `translate(-50%, -50%) rotate(${offset + baseRotation}deg) translateX(var(--radius)) rotate(${-(offset + baseRotation)}deg) translateY(${wobble}px)`;
  });

  requestAnimationFrame(updateOrbitMotion);
}

requestAnimationFrame(updateOrbitMotion);

orbitTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const ai = tab.dataset.ai || 'chat';
    window.open(`chat.html?ai=${encodeURIComponent(ai)}`, '_blank', 'noopener');
  });
});
