/**
 * v68a Halloween Theme Safe
 * Side-effect module for store theme toggle.
 * Does not touch API/payment/provider logic.
 */

type ThemeName = 'normal' | 'halloween';

const STORAGE_KEY = 'erlkim-store-halloween-theme-v68a';

function safeLocalStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore private mode/storage errors
  }
}

function applyTheme(theme: ThemeName): void {
  const html = document.documentElement;
  html.classList.toggle('halloween', theme === 'halloween');

  // Prevent theme collision with old rain mode.
  if (theme === 'halloween') {
    html.classList.remove('rainstorm');
  }

  const toggle = document.querySelector<HTMLButtonElement>('.v68-halloween-toggle');
  if (toggle) {
    toggle.dataset.active = theme === 'halloween' ? 'true' : 'false';
    toggle.innerHTML = theme === 'halloween'
      ? '<span>🎃</span><span>Halloween ON</span>'
      : '<span>🎃</span><span>Halloween</span>';
    toggle.setAttribute(
      'aria-label',
      theme === 'halloween' ? 'Matikan tema Halloween' : 'Aktifkan tema Halloween'
    );
  }
}

function createHalloweenLayer(): void {
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
    { icon: '👻', cls: 'v68-halloween-ghost', start: '6vw', end: '22vw', dur: '11s', delay: '0s' },
    { icon: '🦇', cls: 'v68-halloween-bat', start: '80vw', end: '62vw', dur: '9s', delay: '1.2s' },
    { icon: '👻', cls: 'v68-halloween-ghost', start: '42vw', end: '56vw', dur: '13s', delay: '2.2s' },
    { icon: '🦇', cls: 'v68-halloween-bat', start: '24vw', end: '8vw', dur: '10s', delay: '3.1s' },
    { icon: '👻', cls: 'v68-halloween-ghost', start: '70vw', end: '86vw', dur: '14s', delay: '4.4s' }
  ];

  for (const floater of floaters) {
    const el = document.createElement('div');
    el.className = floater.cls;
    el.textContent = floater.icon;
    el.style.setProperty('--x-start', floater.start);
    el.style.setProperty('--x-end', floater.end);
    el.style.setProperty('--dur', floater.dur);
    el.style.setProperty('--delay', floater.delay);
    layer.appendChild(el);
  }

  document.body.appendChild(layer);
}

function createToggle(): void {
  if (document.querySelector('.v68-halloween-toggle')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'v68-halloween-toggle';
  button.dataset.active = 'false';
  button.innerHTML = '<span>🎃</span><span>Halloween</span>';
  button.setAttribute('aria-label', 'Aktifkan tema Halloween');

  button.addEventListener('click', () => {
    const active = document.documentElement.classList.contains('halloween');
    const nextTheme: ThemeName = active ? 'normal' : 'halloween';
    safeLocalStorageSet(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });

  document.body.appendChild(button);
}

function initHalloweenTheme(): void {
  createHalloweenLayer();
  createToggle();

  const saved = safeLocalStorageGet(STORAGE_KEY);
  applyTheme(saved === 'halloween' ? 'halloween' : 'normal');
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHalloweenTheme, { once: true });
  } else {
    initHalloweenTheme();
  }
}
