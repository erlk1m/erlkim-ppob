const HALLOWEEN_STORAGE_KEY = 'erlkim-halloween-theme-v68b';

function getStoredHalloween(): boolean {
  try {
    return window.localStorage.getItem(HALLOWEEN_STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function setStoredHalloween(active: boolean): void {
  try {
    window.localStorage.setItem(HALLOWEEN_STORAGE_KEY, active ? 'on' : 'off');
  } catch {
    // ignore storage errors
  }
}

function updateHalloweenButton(active: boolean): void {
  const button = document.querySelector<HTMLButtonElement>('.v68-halloween-toggle');
  if (!button) return;

  button.dataset.active = active ? 'true' : 'false';
  button.innerHTML = active
    ? '<span>🎃</span><span>Halloween ON</span>'
    : '<span>🎃</span><span>Halloween</span>';
  button.setAttribute('aria-label', active ? 'Matikan tema Halloween' : 'Aktifkan tema Halloween');
}

function applyHalloween(active: boolean): void {
  document.documentElement.classList.toggle('halloween', active);
  updateHalloweenButton(active);
}

function ensureHalloweenLayer(): void {
  if (document.querySelector('.v68-halloween-layer')) return;

  const layer = document.createElement('div');
  layer.className = 'v68-halloween-layer';
  layer.setAttribute('aria-hidden', 'true');

  const moon = document.createElement('div');
  moon.className = 'v68-halloween-moon';
  layer.appendChild(moon);

  const pumpkin = document.createElement('div');
  pumpkin.className = 'v68-halloween-pumpkin';
  pumpkin.textContent = '🎃';
  layer.appendChild(pumpkin);

  const floaters = [
    ['👻', '6vw', '22vw', '11s', '0s'],
    ['🦇', '80vw', '62vw', '9s', '1.2s'],
    ['👻', '42vw', '56vw', '13s', '2.2s'],
    ['🦇', '24vw', '8vw', '10s', '3.1s']
  ] as const;

  for (const [icon, start, end, dur, delay] of floaters) {
    const el = document.createElement('div');
    el.className = 'v68-halloween-floater';
    el.textContent = icon;
    el.style.setProperty('--x-start', start);
    el.style.setProperty('--x-end', end);
    el.style.setProperty('--dur', dur);
    el.style.setProperty('--delay', delay);
    layer.appendChild(el);
  }

  document.body.appendChild(layer);
}

function ensureHalloweenToggle(): void {
  let button = document.querySelector<HTMLButtonElement>('.v68-halloween-toggle');

  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'v68-halloween-toggle';
    document.body.appendChild(button);
  }

  button.onclick = () => {
    const next = !document.documentElement.classList.contains('halloween');
    setStoredHalloween(next);
    applyHalloween(next);
  };
}

function initHalloweenToggle(): void {
  ensureHalloweenLayer();
  ensureHalloweenToggle();
  applyHalloween(getStoredHalloween());
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHalloweenToggle, { once: true });
  } else {
    initHalloweenToggle();
  }
}

export {};
