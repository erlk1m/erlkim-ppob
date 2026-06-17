const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://api.erlkim.web.id/api').replace(/\/+$/, '');

type PublicSettings = {
  environmentBadgeEnabled?: boolean;
  environmentBadgeText?: string;
  maintenanceMode?: boolean;
};

function isInvoicePage() {
  return window.location.pathname.includes('/invoice/');
}

function mountHelper(settings: PublicSettings) {
  if (settings.maintenanceMode) return;
  if (isInvoicePage()) return;
  if (settings.environmentBadgeEnabled === false) return;
  if (document.getElementById('erlkim-store-testing-helper')) return;

  const box = document.createElement('section');
  box.id = 'erlkim-store-testing-helper';
  box.className = 'erlkimStoreTestingHelper';

  box.innerHTML = `
    <div class="erlkimStoreTestingMain">
      <span class="erlkimStoreTestingIcon">🧪</span>
      <div>
        <strong>${settings.environmentBadgeText || 'Development Testing Mode'}</strong>
        <p>Untuk simulasi sukses Digiflazz gunakan produk <b>XL 10.000</b>, SKU <b>x10</b>, dan nomor <b>087800001230</b>.</p>
      </div>
    </div>

    <div class="erlkimStoreTestingActions">
      <button type="button" data-copy="087800001230">Salin Nomor Test</button>
      <button type="button" data-copy="x10">Salin SKU x10</button>
      <a href="/?category=pulsa">Lihat Pulsa</a>
    </div>
  `;

  const target =
    document.querySelector('.erlkimStoreCheckoutPolish') ||
    document.querySelector('main') ||
    document.body.firstElementChild ||
    document.body;

  if (target && target.parentElement && target !== document.body) {
    target.parentElement.insertBefore(box, target.nextSibling);
  } else {
    document.body.prepend(box);
  }

  box.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(value);
        const original = button.textContent || 'Salin';
        button.textContent = 'Tersalin ✓';
        window.setTimeout(() => {
          button.textContent = original;
        }, 1200);
      } catch {
        window.prompt('Salin manual:', value);
      }
    });
  });
}

async function initStoreTestingHelper() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`, {
      credentials: 'omit',
      cache: 'no-store'
    });
    const json = await res.json();
    if (json?.ok) mountHelper(json.data || {});
  } catch {
    // Non-critical helper.
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoreTestingHelper, { once: true });
  } else {
    initStoreTestingHelper();
  }

  window.setTimeout(initStoreTestingHelper, 1000);
}
