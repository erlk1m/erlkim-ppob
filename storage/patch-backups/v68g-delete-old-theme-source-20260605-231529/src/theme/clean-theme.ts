type StoreTheme = 'halloween' | 'storm';

const STORAGE_KEY = 'erlkim-clean-store-theme';
const TOGGLE_ID = 'store-clean-theme-toggle';
const WEATHER_ID = 'store-clean-weather';

function getTheme(): StoreTheme {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'storm' ? 'storm' : 'halloween';
}

function applyTheme(theme: StoreTheme) {
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

  html.dataset.storeTheme = theme;
  document.body?.setAttribute('data-store-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);

  document.querySelectorAll<HTMLButtonElement>('[data-store-clean-theme]').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.storeCleanTheme === theme ? 'true' : 'false');
  });
}

function removeLegacyThemeDom() {
  document.querySelectorAll(
    [
      '#v68-theme-toggle',
      '#v68c-theme-toggle',
      '#erlkim-v68d-theme-toggle',
      '#v68-weather-layer',
      '.v68-theme-toggle',
      '.theme-floating',
      '.rainstorm-toggle'
    ].join(',')
  ).forEach((el) => el.remove());

  document.querySelectorAll<HTMLElement>('button, a, [role="button"]').forEach((el) => {
    if (el.closest('#' + TOGGLE_ID)) return;

    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

    const isLegacy =
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

    if (isLegacy) {
      el.remove();
    }
  });
}

function ensureWeatherLayer() {
  let layer = document.querySelector<HTMLElement>('#' + WEATHER_ID);

  if (!layer) {
    layer = document.createElement('div');
    layer.id = WEATHER_ID;
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
}

function createButton(theme: StoreTheme, icon: string, label: string) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = icon;
  btn.dataset.storeCleanTheme = theme;
  btn.setAttribute('aria-label', label);
  btn.addEventListener('click', () => applyTheme(theme));
  return btn;
}

function ensureToggle() {
  let toggle = document.querySelector<HTMLElement>('#' + TOGGLE_ID);

  if (!toggle) {
    toggle = document.createElement('div');
    toggle.id = TOGGLE_ID;
    toggle.setAttribute('aria-label', 'Pilih tema');

    toggle.appendChild(createButton('halloween', '🎃', 'Tema Halloween'));
    toggle.appendChild(createButton('storm', '⛈️', 'Tema Hujan Petir'));

    document.body.appendChild(toggle);
  }
}

function initCleanTheme() {
  removeLegacyThemeDom();
  ensureWeatherLayer();
  ensureToggle();
  applyTheme(getTheme());

  const observer = new MutationObserver(() => {
    removeLegacyThemeDom();
    ensureWeatherLayer();
    ensureToggle();
    applyTheme(getTheme());
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCleanTheme);
  } else {
    initCleanTheme();
  }
}

export {};
