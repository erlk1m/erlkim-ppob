const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://api.erlkim.web.id/api').replace(/\/+$/, '');

type MaintenanceSettings = {
  maintenanceMode?: boolean | string;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  maintenanceEta?: string;
  maintenanceWhatsapp?: string;
  brandName?: string;
};

function boolValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  return false;
}

function cleanWhatsapp(value: string) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function escapeHtml(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function injectMaintenanceStyle() {
  if (document.getElementById('erlkim-maintenance-force-style')) return;

  const style = document.createElement('style');
  style.id = 'erlkim-maintenance-force-style';
  style.textContent = `
    html.erlkimMaintenanceLocked,
    html.erlkimMaintenanceLocked body {
      overflow: hidden !important;
      height: 100% !important;
    }

    html.erlkimMaintenanceLocked body > *:not(#erlkim-web-maintenance-mode) {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    #erlkim-web-maintenance-mode {
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      display: grid !important;
      place-items: center !important;
      padding: 22px !important;
      background:
        radial-gradient(circle at top left, #facc15 0 18%, transparent 19%),
        radial-gradient(circle at bottom right, #93c5fd 0 20%, transparent 21%),
        #fff7ed !important;
      color: #111827 !important;
      overflow: auto !important;
    }

    #erlkim-web-maintenance-mode * {
      box-sizing: border-box !important;
    }

    .erlkimMaintenanceBgShape {
      position: absolute !important;
      border: 4px solid #111827 !important;
      box-shadow: 8px 8px 0 #111827 !important;
      opacity: .9 !important;
      pointer-events: none !important;
    }

    .erlkimMaintenanceBgShape.one {
      width: 120px !important;
      height: 120px !important;
      border-radius: 30px !important;
      background: #fb7185 !important;
      top: 8% !important;
      right: 10% !important;
      transform: rotate(12deg) !important;
    }

    .erlkimMaintenanceBgShape.two {
      width: 90px !important;
      height: 90px !important;
      border-radius: 999px !important;
      background: #22c55e !important;
      bottom: 10% !important;
      left: 8% !important;
    }

    .erlkimMaintenanceCard {
      position: relative !important;
      width: min(620px, 100%) !important;
      display: grid !important;
      gap: 14px !important;
      border: 5px solid #111827 !important;
      border-radius: 28px !important;
      background: rgba(255, 255, 255, .96) !important;
      padding: clamp(22px, 5vw, 42px) !important;
      box-shadow: 12px 12px 0 #111827 !important;
      text-align: center !important;
      font-family: inherit !important;
    }

    .erlkimMaintenanceLogo {
      width: 76px !important;
      height: 76px !important;
      margin: 0 auto !important;
      display: grid !important;
      place-items: center !important;
      border: 4px solid #111827 !important;
      border-radius: 22px !important;
      background: #facc15 !important;
      box-shadow: 5px 5px 0 #111827 !important;
      font-size: 26px !important;
      font-weight: 1000 !important;
    }

    .erlkimMaintenanceEyebrow {
      width: fit-content !important;
      margin: 0 auto !important;
      border: 3px solid #111827 !important;
      border-radius: 999px !important;
      background: #111827 !important;
      color: #fff !important;
      padding: 6px 12px !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      letter-spacing: .08em !important;
      text-transform: uppercase !important;
    }

    .erlkimMaintenanceCard h1 {
      margin: 0 !important;
      font-size: clamp(30px, 7vw, 56px) !important;
      line-height: .95 !important;
      letter-spacing: -.04em !important;
      color: #111827 !important;
    }

    .erlkimMaintenanceCard p {
      margin: 0 !important;
      font-size: clamp(15px, 2.5vw, 18px) !important;
      line-height: 1.55 !important;
      color: #111827 !important;
    }

    .erlkimMaintenanceInfo {
      border: 3px solid #111827 !important;
      border-radius: 18px !important;
      background: #fef3c7 !important;
      padding: 12px !important;
      box-shadow: 4px 4px 0 #111827 !important;
      display: grid !important;
      gap: 4px !important;
    }

    .erlkimMaintenanceInfo span {
      font-size: 12px !important;
      font-weight: 900 !important;
      opacity: .7 !important;
      text-transform: uppercase !important;
    }

    .erlkimMaintenanceInfo b {
      font-size: 16px !important;
      color: #111827 !important;
    }

    .erlkimMaintenanceActions {
      display: flex !important;
      justify-content: center !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    .erlkimMaintenanceActions button,
    .erlkimMaintenanceActions a {
      border: 3px solid #111827 !important;
      border-radius: 14px !important;
      background: #111827 !important;
      color: #fff !important;
      padding: 12px 16px !important;
      box-shadow: 4px 4px 0 #111827 !important;
      font-weight: 900 !important;
      text-decoration: none !important;
      cursor: pointer !important;
    }

    .erlkimMaintenanceActions a {
      background: #22c55e !important;
      color: #052e16 !important;
    }

    .erlkimMaintenanceCard small {
      opacity: .72 !important;
      font-weight: 800 !important;
      color: #111827 !important;
    }

    @media (max-width: 640px) {
      #erlkim-web-maintenance-mode {
        padding: 14px !important;
      }

      .erlkimMaintenanceCard {
        border-width: 4px !important;
        border-radius: 22px !important;
        box-shadow: 7px 7px 0 #111827 !important;
      }

      .erlkimMaintenanceBgShape {
        display: none !important;
      }

      .erlkimMaintenanceActions {
        display: grid !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function mountMaintenance(settings: MaintenanceSettings) {
  if (!boolValue(settings.maintenanceMode)) {
    document.documentElement.classList.remove('erlkimMaintenanceLocked');
    document.getElementById('erlkim-web-maintenance-mode')?.remove();
    return;
  }

  injectMaintenanceStyle();

  document.getElementById('erlkim-web-maintenance-mode')?.remove();

  const whatsapp = cleanWhatsapp(settings.maintenanceWhatsapp || '');
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/^\+/, '')}` : '';
  const brand = escapeHtml(settings.brandName || 'ERLKIM PULSA');
  const logo = brand.slice(0, 2).toUpperCase();

  const root = document.createElement('div');
  root.id = 'erlkim-web-maintenance-mode';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Maintenance mode');

  root.innerHTML = `
    <div class="erlkimMaintenanceBgShape one"></div>
    <div class="erlkimMaintenanceBgShape two"></div>

    <main class="erlkimMaintenanceCard">
      <div class="erlkimMaintenanceLogo">${escapeHtml(logo)}</div>
      <span class="erlkimMaintenanceEyebrow">Maintenance Mode</span>
      <h1>${escapeHtml(settings.maintenanceTitle || 'Web Sedang Maintenance')}</h1>
      <p>${escapeHtml(settings.maintenanceMessage || 'Kami sedang melakukan perawatan sistem agar layanan PPOB lebih stabil dan aman.')}</p>

      <div class="erlkimMaintenanceInfo">
        <span>Estimasi</span>
        <b>${escapeHtml(settings.maintenanceEta || 'Silakan cek kembali beberapa saat lagi.')}</b>
      </div>

      <div class="erlkimMaintenanceActions">
        <button type="button" id="erlkim-maintenance-reload">Cek Lagi</button>
        ${waHref ? `<a href="${waHref}" target="_blank" rel="noreferrer">Hubungi Admin</a>` : ''}
      </div>

      <small>Admin dan sistem backend tetap aktif selama perawatan.</small>
    </main>
  `;

  document.body.appendChild(root);
  document.documentElement.classList.add('erlkimMaintenanceLocked');

  document.getElementById('erlkim-maintenance-reload')?.addEventListener('click', () => {
    window.location.reload();
  });
}

async function initMaintenanceMode() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`, {
      credentials: 'omit',
      cache: 'no-store'
    });
    const json = await res.json();
    if (json?.ok) mountMaintenance(json.data || {});
  } catch {
    // Kalau API gagal, jangan menutup web otomatis.
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMaintenanceMode, { once: true });
  } else {
    initMaintenanceMode();
  }

  window.setTimeout(initMaintenanceMode, 800);
  window.setTimeout(initMaintenanceMode, 2200);
}
