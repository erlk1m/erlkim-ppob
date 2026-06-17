type ThemeName = 'halloween' | 'storm';

const STORAGE_KEY = 'erlkim-store-theme-v68';

function getSavedTheme(): ThemeName {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'storm' || saved === 'halloween') return saved;
  return 'halloween';
}

function applyTheme(theme: ThemeName) {
  const html = document.documentElement;

  html.classList.remove(
    'normal',
    'theme-normal',
    'rain',
    'hujan',
    'storm',
    'rainstorm',
    'halowin',
    'haloween',
    'halloween'
  );

  html.dataset.erlkimTheme = theme;

  if (theme === 'storm') {
    html.classList.add('rainstorm');
  } else {
    html.classList.add('halloween');
  }

  document.body?.setAttribute('data-erlkim-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);

  document.querySelectorAll<HTMLButtonElement>('[data-v68c-theme]').forEach((btn) => {
    const active = btn.dataset.v68cTheme === theme;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function ensureWeatherLayer() {
  if (document.querySelector('#v68-weather-layer')) return;

  const layer = document.createElement('div');
  layer.id = 'v68-weather-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
}

function removeOldThemeControls() {
  document.querySelectorAll('#v68-theme-toggle').forEach((el) => el.remove());

  document
    .querySelectorAll<HTMLElement>(
      'button, a, [role="button"], [class*="theme"], [class*="Theme"], [class*="rain"], [class*="Rain"]'
    )
    .forEach((el) => {
      if (el.closest('#v68c-theme-toggle')) return;

      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

      const isOldThemeControl =
        text === 'normal' ||
        text === 'hujan' ||
        text === 'rain' ||
        text === 'rainstorm' ||
        text === 'halloween' ||
        text === 'haloween' ||
        text === 'halowin' ||
        text === '🎃 halloween' ||
        text === '⛈️ hujan petir' ||
        text.includes('tema:') ||
        text.includes('mode normal') ||
        text.includes('mode hujan') ||
        text.includes('hujan petir');

      if (isOldThemeControl) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });
}

function ensureIconToggle() {
  if (document.querySelector('#v68c-theme-toggle')) return;

  const wrap = document.createElement('div');
  wrap.id = 'v68c-theme-toggle';
  wrap.setAttribute('aria-label', 'Pilih tema');

  wrap.innerHTML = `
    <button type="button" data-v68c-theme="halloween" aria-label="Tema Halloween">🎃</button>
    <button type="button" data-v68c-theme="storm" aria-label="Tema Hujan Petir">⛈️</button>
  `;

  document.body.appendChild(wrap);

  wrap.querySelectorAll<HTMLButtonElement>('[data-v68c-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.v68cTheme === 'storm' ? 'storm' : 'halloween';
      applyTheme(next);
    });
  });
}

function init() {
  ensureWeatherLayer();
  removeOldThemeControls();
  ensureIconToggle();
  applyTheme(getSavedTheme());

  const observer = new MutationObserver(() => {
    removeOldThemeControls();
    ensureIconToggle();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export {};
