type ThemeName = 'halloween' | 'storm';

const STORAGE_KEY = 'erlkim-store-theme-v68';
const TOGGLE_ID = 'erlkim-v68d-theme-toggle';

function getTheme(): ThemeName {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'storm' ? 'storm' : 'halloween';
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

  const halloweenBtn = document.querySelector<HTMLButtonElement>('[data-v68d-theme="halloween"]');
  const stormBtn = document.querySelector<HTMLButtonElement>('[data-v68d-theme="storm"]');

  if (halloweenBtn) {
    halloweenBtn.setAttribute('aria-pressed', theme === 'halloween' ? 'true' : 'false');
    halloweenBtn.style.background = theme === 'halloween' ? '#ff8a00' : '#24112f';
    halloweenBtn.style.color = theme === 'halloween' ? '#160a22' : '#fff7df';
  }

  if (stormBtn) {
    stormBtn.setAttribute('aria-pressed', theme === 'storm' ? 'true' : 'false');
    stormBtn.style.background = theme === 'storm' ? '#68d8ff' : '#24112f';
    stormBtn.style.color = theme === 'storm' ? '#07111f' : '#fff7df';
  }
}

function ensureWeatherLayer() {
  let layer = document.querySelector<HTMLElement>('#v68-weather-layer');

  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'v68-weather-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }

  layer.style.position = 'fixed';
  layer.style.inset = '0';
  layer.style.pointerEvents = 'none';
  layer.style.zIndex = '1';
}

function removeOldToggleDom() {
  document.querySelectorAll(
    '#v68-theme-toggle, #v68c-theme-toggle, #erlkim-v68-theme-toggle, .v68-theme-toggle, .theme-floating, .rainstorm-toggle'
  ).forEach((el) => el.remove());

  document.querySelectorAll<HTMLElement>('button, a, [role="button"]').forEach((el) => {
    if (el.closest('#' + TOGGLE_ID)) return;

    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

    const isOldTheme =
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

    if (isOldTheme) {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.setAttribute('aria-hidden', 'true');
    }
  });
}

function buttonStyle(btn: HTMLButtonElement) {
  btn.style.width = '36px';
  btn.style.height = '36px';
  btn.style.display = 'grid';
  btn.style.placeItems = 'center';
  btn.style.border = '2px solid #000';
  btn.style.borderRadius = '999px';
  btn.style.background = '#24112f';
  btn.style.color = '#fff7df';
  btn.style.fontSize = '19px';
  btn.style.lineHeight = '1';
  btn.style.padding = '0';
  btn.style.margin = '0';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '2px 2px 0 #000';
  btn.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function ensureToggle() {
  let wrap = document.querySelector<HTMLElement>('#' + TOGGLE_ID);

  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = TOGGLE_ID;
    wrap.setAttribute('aria-label', 'Pilih tema');

    const halloween = document.createElement('button');
    halloween.type = 'button';
    halloween.textContent = '🎃';
    halloween.dataset.v68dTheme = 'halloween';
    halloween.setAttribute('aria-label', 'Tema Halloween');
    buttonStyle(halloween);

    const storm = document.createElement('button');
    storm.type = 'button';
    storm.textContent = '⛈️';
    storm.dataset.v68dTheme = 'storm';
    storm.setAttribute('aria-label', 'Tema Hujan Petir');
    buttonStyle(storm);

    halloween.addEventListener('click', () => applyTheme('halloween'));
    storm.addEventListener('click', () => applyTheme('storm'));

    wrap.appendChild(halloween);
    wrap.appendChild(storm);
    document.body.appendChild(wrap);
  }

  wrap.style.position = 'fixed';
  wrap.style.top = '12px';
  wrap.style.right = '12px';
  wrap.style.left = 'auto';
  wrap.style.bottom = 'auto';
  wrap.style.zIndex = '2147483647';
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'row';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'center';
  wrap.style.gap = '6px';
  wrap.style.width = 'auto';
  wrap.style.height = 'auto';
  wrap.style.padding = '6px';
  wrap.style.margin = '0';
  wrap.style.border = '3px solid #000';
  wrap.style.borderRadius = '999px';
  wrap.style.background = '#160a22';
  wrap.style.boxShadow = '4px 4px 0 #000';
  wrap.style.pointerEvents = 'auto';
  wrap.style.transform = 'none';
}

function init() {
  removeOldToggleDom();
  ensureWeatherLayer();
  ensureToggle();
  applyTheme(getTheme());

  const observer = new MutationObserver(() => {
    removeOldToggleDom();
    ensureToggle();
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
