const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://api.erlkim.web.id/api').replace(/\/+$/, '');

type PublicSettings = {
  environmentBadgeEnabled?: boolean;
  environmentBadgeText?: string;
  environmentBadgeDescription?: string;
};

function isStorePage() {
  const path = window.location.pathname;
  return !path.includes('/invoice/');
}

function isCheckoutLikePage() {
  const text = document.body.innerText.toLowerCase();
  return (
    text.includes('checkout') ||
    text.includes('bayar') ||
    text.includes('manual qris') ||
    text.includes('nomor tujuan') ||
    text.includes('pilih produk') ||
    text.includes('produk')
  );
}

function alreadyMounted() {
  return Boolean(document.getElementById('erlkim-store-checkout-polish'));
}

function mountCheckoutPolish(settings: PublicSettings) {
  if (!isStorePage()) return;
  if (!isCheckoutLikePage()) return;
  if (alreadyMounted()) return;

  const enabled = settings.environmentBadgeEnabled !== false;

  const box = document.createElement('div');
  box.id = 'erlkim-store-checkout-polish';
  box.className = 'erlkimStoreCheckoutPolish';

  box.innerHTML = `
    <div>
      <strong>${enabled ? (settings.environmentBadgeText || 'Development Testing Mode') : 'Info Transaksi'}</strong>
      <p>${enabled ? 'Mode testing Digiflazz aktif. Untuk simulasi sukses gunakan SKU/produk XL 10.000 dan nomor 087800001230.' : 'Pastikan nomor tujuan dan produk sudah benar sebelum membuat invoice.'}</p>
      <div class="erlkimStoreCheckoutTips">
        <span>Manual QRIS: bayar sesuai total</span>
        <span>Admin approve setelah dana masuk</span>
        <span>SN muncul setelah provider sukses</span>
      </div>
    </div>
  `;

  const target =
    document.querySelector('.hero') ||
    document.querySelector('main') ||
    document.body.firstElementChild ||
    document.body;

  if (target && target.parentElement && target !== document.body) {
    target.parentElement.insertBefore(box, target.nextSibling);
  } else {
    document.body.prepend(box);
  }
}

async function initStoreCheckoutPolish() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`);
    const json = await res.json();
    mountCheckoutPolish(json?.data || {});
  } catch {
    mountCheckoutPolish({});
  }
}

function scheduleInit() {
  window.setTimeout(initStoreCheckoutPolish, 600);
  window.setTimeout(initStoreCheckoutPolish, 1600);
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit, { once: true });
  } else {
    scheduleInit();
  }
}
