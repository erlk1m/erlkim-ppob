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
    'halloween',
    'halowin',
    'haloween'
  );

  html.dataset.erlkimTheme = theme;

  if (theme === 'storm') {
    html.classList.add('rainstorm');
  } else {
    html.classList.add('halloween');
  }

  document.body?.setAttribute('data-erlkim-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);

  const label = document.querySelector<HTMLElement>('#v68-theme-current');
  if (label) label.textContent = theme === 'storm' ? 'Hujan Petir' : 'Halloween';

  document.querySelectorAll<HTMLButtonElement>('[data-v68-theme-button]').forEach((btn) => {
    const active = btn.dataset.v68ThemeButton === theme;
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

function hideOldThemeButtons() {
  const candidates = document.querySelectorAll<HTMLElement>(
    'header button, nav button, [class*="header"] button, [class*="nav"] button, [class*="theme"] button'
  );

  candidates.forEach((el) => {
    if (el.closest('#v68-theme-toggle')) return;

    const text = (el.textContent || '').trim().toLowerCase();

    if (
      text === 'normal' ||
      text === 'hujan' ||
      text === 'rain' ||
      text === 'rainstorm' ||
      text === 'halloween' ||
      text === 'haloween' ||
      text === 'halowin' ||
      text.includes('mode hujan') ||
      text.includes('mode normal')
    ) {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    }
  });
}

function ensureThemeToggle() {
  if (document.querySelector('#v68-theme-toggle')) return;

  const wrap = document.createElement('div');
  wrap.id = 'v68-theme-toggle';
  wrap.innerHTML = `
    <div class="v68-theme-label">Tema: <strong id="v68-theme-current">Halloween</strong></div>
    <div class="v68-theme-buttons">
      <button type="button" data-v68-theme-button="halloween">🎃 Halloween</button>
      <button type="button" data-v68-theme-button="storm">⛈️ Hujan Petir</button>
    </div>
  `;

  document.body.appendChild(wrap);

  wrap.querySelectorAll<HTMLButtonElement>('[data-v68-theme-button]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.v68ThemeButton === 'storm' ? 'storm' : 'halloween';
      applyTheme(next);
    });
  });
}

function initV68Theme() {
  ensureWeatherLayer();
  ensureThemeToggle();
  applyTheme(getSavedTheme());
  hideOldThemeButtons();

  const observer = new MutationObserver(() => {
    hideOldThemeButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initV68Theme);
  } else {
    initV68Theme();
  }
}

export {};
