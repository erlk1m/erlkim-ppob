const API_BASE = ((import.meta as any).env?.VITE_API_URL || '/api').replace(/\/+$/, '');

type BadgeSettings = {
  environmentBadgeEnabled?: boolean;
  environmentBadgeText?: string;
  environmentBadgeDescription?: string;
  environmentBadgeVariant?: string;
  environmentBadgeShowOnInvoice?: boolean;
};

function readToken(): string {
  const keys = ['adminToken', 'ADMIN_TOKEN', 'token', 'authToken', 'erlkimAdminToken', 'erlkim_admin_token'];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && value.length > 10) return value.replace(/^Bearer\s+/i, '');
  }
  return '';
}

function setToken(token: string) {
  if (token && token.length > 10) localStorage.setItem('erlkimAdminToken', token.replace(/^Bearer\s+/i, ''));
}

async function adminFetch(path: string, options: RequestInit = {}) {
  let token = readToken();

  const run = () => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }
  });

  let res = await run();

  if (res.status === 401 || res.status === 403) {
    const prompted = window.prompt('Masukkan ADMIN_TOKEN untuk simpan setting badge:');
    if (prompted) {
      token = prompted.trim();
      setToken(token);
      res = await run();
    }
  }

  return res;
}

function injectStyles() {
  if (document.getElementById('erlkim-badge-admin-style')) return;
  const style = document.createElement('style');
  style.id = 'erlkim-badge-admin-style';
  style.textContent = `
    .erlkimBadgeAdminBtn {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 99999;
      border: 3px solid #111827;
      border-radius: 999px;
      background: #facc15;
      color: #111827;
      font-weight: 900;
      padding: 10px 14px;
      box-shadow: 4px 4px 0 #111827;
      cursor: pointer;
    }
    .erlkimBadgeAdminPanel {
      position: fixed;
      right: 18px;
      bottom: 72px;
      z-index: 99999;
      width: min(420px, calc(100vw - 36px));
      background: #fff;
      border: 3px solid #111827;
      border-radius: 18px;
      box-shadow: 6px 6px 0 #111827;
      padding: 16px;
      color: #111827;
      display: none;
      gap: 10px;
    }
    .erlkimBadgeAdminPanel.open { display: grid; }
    .erlkimBadgeAdminPanel h3 { margin: 0; font-size: 18px; }
    .erlkimBadgeAdminPanel label { display: grid; gap: 6px; font-size: 13px; font-weight: 800; }
    .erlkimBadgeAdminPanel input[type="text"],
    .erlkimBadgeAdminPanel textarea {
      border: 2px solid #111827;
      border-radius: 12px;
      padding: 10px;
      font: inherit;
    }
    .erlkimBadgeAdminPanel textarea { min-height: 74px; resize: vertical; }
    .erlkimBadgeAdminPanel .row { display: flex; align-items: center; gap: 10px; }
    .erlkimBadgeAdminPanel button {
      border: 2px solid #111827;
      border-radius: 12px;
      padding: 10px 12px;
      font-weight: 900;
      cursor: pointer;
      background: #111827;
      color: #fff;
    }
    .erlkimBadgeAdminPanel .ghost {
      background: #fff;
      color: #111827;
    }
    .erlkimBadgeAdminStatus { font-size: 12px; opacity: .8; }
  `;
  document.head.appendChild(style);
}

async function loadPublicSettings(): Promise<BadgeSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings/public`);
    const json = await res.json();
    return json?.data || {};
  } catch {
    return {};
  }
}

async function mountBadgeAdminControl() {
  injectStyles();

  const existing = document.getElementById('erlkim-badge-admin-btn');
  if (existing) return;

  const btn = document.createElement('button');
  btn.id = 'erlkim-badge-admin-btn';
  btn.className = 'erlkimBadgeAdminBtn';
  btn.type = 'button';
  btn.textContent = '🧪 Testing Badge';

  const panel = document.createElement('div');
  panel.className = 'erlkimBadgeAdminPanel';
  panel.innerHTML = `
    <h3>Testing Mode Badge</h3>
    <label class="row">
      <input id="erlkim-badge-enabled" type="checkbox" />
      Tampilkan badge di Store
    </label>
    <label class="row">
      <input id="erlkim-badge-invoice" type="checkbox" />
      Tampilkan juga di invoice
    </label>
    <label>
      Teks badge
      <input id="erlkim-badge-text" type="text" maxlength="80" />
    </label>
    <label>
      Deskripsi
      <textarea id="erlkim-badge-description" maxlength="220"></textarea>
    </label>
    <div class="row">
      <button id="erlkim-badge-save" type="button">Simpan</button>
      <button id="erlkim-badge-close" class="ghost" type="button">Tutup</button>
    </div>
    <div id="erlkim-badge-status" class="erlkimBadgeAdminStatus">Siap.</div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const enabled = panel.querySelector<HTMLInputElement>('#erlkim-badge-enabled')!;
  const invoice = panel.querySelector<HTMLInputElement>('#erlkim-badge-invoice')!;
  const text = panel.querySelector<HTMLInputElement>('#erlkim-badge-text')!;
  const description = panel.querySelector<HTMLTextAreaElement>('#erlkim-badge-description')!;
  const status = panel.querySelector<HTMLDivElement>('#erlkim-badge-status')!;

  async function refresh() {
    const s = await loadPublicSettings();
    enabled.checked = Boolean(s.environmentBadgeEnabled);
    invoice.checked = s.environmentBadgeShowOnInvoice !== false;
    text.value = s.environmentBadgeText || 'Development Testing Mode';
    description.value = s.environmentBadgeDescription || 'Mode testing Digiflazz aktif. Gunakan nomor test-case untuk simulasi transaksi.';
  }

  btn.onclick = async () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) await refresh();
  };

  panel.querySelector<HTMLButtonElement>('#erlkim-badge-close')!.onclick = () => panel.classList.remove('open');

  panel.querySelector<HTMLButtonElement>('#erlkim-badge-save')!.onclick = async () => {
    status.textContent = 'Menyimpan...';
    const body = {
      environmentBadgeEnabled: enabled.checked,
      environmentBadgeShowOnInvoice: invoice.checked,
      environmentBadgeText: text.value,
      environmentBadgeDescription: description.value,
      environmentBadgeVariant: 'warning'
    };

    try {
      const res = await adminFetch('/admin/environment-badge', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      status.textContent = 'Tersimpan. Refresh Store untuk melihat perubahan.';
    } catch (error: any) {
      status.textContent = `Gagal simpan: ${error.message || error}`;
    }
  };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBadgeAdminControl, { once: true });
  } else {
    mountBadgeAdminControl();
  }
}
