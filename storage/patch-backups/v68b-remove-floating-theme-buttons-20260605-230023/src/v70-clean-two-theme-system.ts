type ErlTheme = 'storm' | 'halloween';

const STORAGE_KEY = 'erlkim-theme-v70-clean';
const THEMES: ErlTheme[] = ['storm', 'halloween'];

function readTheme(): ErlTheme {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'halloween' || value === 'storm') return value;
  } catch {
    // ignore
  }
  return 'storm';
}

function saveTheme(theme: ErlTheme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

function cleanupOldThemeRuntime(): void {
  document.documentElement.classList.remove('rainstorm', 'halloween');
  document.querySelectorAll('.v68-halloween-toggle, .v68-halloween-layer').forEach((el) => el.remove());
}

function ensureLayer(): void {
  if (document.querySelector('.erl-theme-layer')) return;

  const layer = document.createElement('div');
  layer.className = 'erl-theme-layer';
  layer.setAttribute('aria-hidden', 'true');

  const rain = document.createElement('div');
  rain.className = 'erl-rain';
  layer.appendChild(rain);

  const cloudOne = document.createElement('div');
  cloudOne.className = 'erl-cloud one';
  layer.appendChild(cloudOne);

  const cloudTwo = document.createElement('div');
  cloudTwo.className = 'erl-cloud two';
  layer.appendChild(cloudTwo);

  const lightning = document.createElement('div');
  lightning.className = 'erl-lightning';
  layer.appendChild(lightning);

  const spookyA = document.createElement('div');
  spookyA.className = 'erl-spooky a';
  spookyA.textContent = '👻';
  layer.appendChild(spookyA);

  const spookyB = document.createElement('div');
  spookyB.className = 'erl-spooky b';
  spookyB.textContent = '🦇';
  layer.appendChild(spookyB);

  const spookyC = document.createElement('div');
  spookyC.className = 'erl-spooky c';
  spookyC.textContent = '🎃';
  layer.appendChild(spookyC);

  document.body.appendChild(layer);
}

function ensureSwitcher(): void {
  if (document.querySelector('.erl-theme-switcher')) return;

  const wrap = document.createElement('div');
  wrap.className = 'erl-theme-switcher';

  const storm = document.createElement('button');
  storm.type = 'button';
  storm.dataset.theme = 'storm';
  storm.innerHTML = '⛈️ Hujan';

  const halloween = document.createElement('button');
  halloween.type = 'button';
  halloween.dataset.theme = 'halloween';
  halloween.innerHTML = '🎃 Halloween';

  storm.addEventListener('click', () => applyTheme('storm', true));
  halloween.addEventListener('click', () => applyTheme('halloween', true));

  wrap.appendChild(storm);
  wrap.appendChild(halloween);
  document.body.appendChild(wrap);
}

function applyTheme(theme: ErlTheme, persist = false): void {
  cleanupOldThemeRuntime();

  const html = document.documentElement;
  for (const item of THEMES) {
    html.classList.remove(`erl-theme-${item}`);
  }
  html.classList.add(`erl-theme-${theme}`);
  html.dataset.erlTheme = theme;

  ensureLayer();
  ensureSwitcher();

  document.querySelectorAll<HTMLButtonElement>('.erl-theme-switcher button').forEach((button) => {
    button.dataset.active = button.dataset.theme === theme ? 'true' : 'false';
  });

  if (persist) saveTheme(theme);
}

function initTheme(): void {
  applyTheme(readTheme(), false);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme, { once: true });
  } else {
    initTheme();
  }
}

export {};
