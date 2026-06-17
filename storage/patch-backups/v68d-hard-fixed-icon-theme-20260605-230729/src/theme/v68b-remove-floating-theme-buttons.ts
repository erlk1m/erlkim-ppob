function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isThemeButtonText(text: string) {
  const t = normalizeText(text);

  return (
    t === 'normal' ||
    t === 'hujan' ||
    t === 'rain' ||
    t === 'rainstorm' ||
    t === 'halloween' ||
    t === 'haloween' ||
    t === 'halowin' ||
    t === '🎃 halloween' ||
    t === '⛈️ hujan petir' ||
    t.includes('tema:') ||
    t.includes('mode normal') ||
    t.includes('mode hujan') ||
    t.includes('hujan petir')
  );
}

function removeFloatingThemeButtons() {
  document.querySelectorAll('#v68-theme-toggle').forEach((el) => {
    el.remove();
  });

  document
    .querySelectorAll<HTMLElement>('button, a, [role="button"], [class*="theme"], [class*="Theme"], [class*="rain"], [class*="Rain"]')
    .forEach((el) => {
      const text = normalizeText(el.textContent || '');

      if (!isThemeButtonText(text)) return;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const looksFloating =
        style.position === 'fixed' ||
        style.position === 'sticky' ||
        rect.bottom > window.innerHeight - 140 ||
        rect.top < 120;

      if (looksFloating) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });
}

function forceHalloweenDefault() {
  const html = document.documentElement;

  html.classList.remove('normal', 'theme-normal', 'rain', 'hujan', 'storm', 'rainstorm', 'halowin', 'haloween');
  html.classList.add('halloween');
  html.dataset.erlkimTheme = 'halloween';

  document.body?.setAttribute('data-erlkim-theme', 'halloween');
}

function init() {
  forceHalloweenDefault();
  removeFloatingThemeButtons();

  const observer = new MutationObserver(() => {
    forceHalloweenDefault();
    removeFloatingThemeButtons();
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
