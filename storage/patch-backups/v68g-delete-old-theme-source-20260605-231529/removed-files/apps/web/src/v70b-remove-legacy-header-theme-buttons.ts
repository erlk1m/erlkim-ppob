/**
 * v70b Remove Legacy Header Theme Buttons
 * Removes old Hujan/Normal/Halloween controls rendered inside header/topbar.
 * Keeps WhatsApp and keeps the new .erl-theme-switcher.
 */

const LEGACY_TEXTS = [
  'normal',
  'hujan',
  'rain',
  'rainstorm',
  'storm',
  'cuaca',
  'weather',
  'halloween on'
];

function isInsideNewThemeSwitcher(el: Element): boolean {
  return Boolean(el.closest('.erl-theme-switcher'));
}

function isInsideHeader(el: Element): boolean {
  return Boolean(el.closest('header, .header, .siteHeader, .navbar, .topbar'));
}

function isLikelyLegacyThemeControl(el: Element): boolean {
  if (isInsideNewThemeSwitcher(el)) return false;
  if (!isInsideHeader(el)) return false;

  const tag = el.tagName.toLowerCase();
  if (!['button', 'a', 'span', 'div'].includes(tag)) return false;

  const text = (el.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!text) return false;

  // Jangan ganggu tombol WhatsApp atau menu utama.
  if (text.includes('whatsapp')) return false;
  if (['beranda', 'produk', 'tagihan', 'cek pesanan', 'bantuan'].includes(text)) return false;

  return LEGACY_TEXTS.some((needle) => text === needle || text.includes(needle));
}

function hideLegacyThemeControls(): void {
  const candidates = document.querySelectorAll('header button, header a, header span, header div, .header button, .header a, .header span, .header div, .siteHeader button, .siteHeader a, .siteHeader span, .siteHeader div, .navbar button, .navbar a, .navbar span, .navbar div, .topbar button, .topbar a, .topbar span, .topbar div');

  candidates.forEach((el) => {
    if (!isLikelyLegacyThemeControl(el)) return;

    const clickableParent = el.closest('button, a') || el;
    clickableParent.classList.add('erl-legacy-theme-control-hidden');
    clickableParent.setAttribute('aria-hidden', 'true');
  });
}

function initLegacyThemeCleanup(): void {
  hideLegacyThemeControls();

  const observer = new MutationObserver(() => {
    hideLegacyThemeControls();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLegacyThemeCleanup, { once: true });
  } else {
    initLegacyThemeCleanup();
  }
}

export {};
