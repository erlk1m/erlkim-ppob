type StatusMeta = {
  label: string;
  tone: string;
  description: string;
};

const STATUS_META: Record<string, StatusMeta> = {
  unpaid: {
    label: 'Unpaid',
    tone: 'warning',
    description: 'Customer belum dibayar / belum di-approve.'
  },
  paid: {
    label: 'Paid',
    tone: 'success',
    description: 'Pembayaran sudah masuk / sudah di-approve.'
  },
  pending: {
    label: 'Pending',
    tone: 'warning',
    description: 'Order dibuat, menunggu pembayaran atau proses lanjutan.'
  },
  processing: {
    label: 'Processing',
    tone: 'info',
    description: 'Transaksi sudah dikirim ke provider dan menunggu hasil final.'
  },
  need_check: {
    label: 'Need Check',
    tone: 'warning',
    description: 'Butuh cek status provider ulang.'
  },
  success: {
    label: 'Success',
    tone: 'success',
    description: 'Transaksi sukses dan final.'
  },
  failed: {
    label: 'Failed',
    tone: 'danger',
    description: 'Transaksi gagal dan final.'
  },
  canceled: {
    label: 'Canceled',
    tone: 'muted',
    description: 'Order dibatalkan.'
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'muted',
    description: 'Order dibatalkan.'
  }
};

function normalizeStatus(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function injectAdminStatusStyles() {
  if (document.getElementById('erlkim-admin-status-helper-style')) return;

  const style = document.createElement('style');
  style.id = 'erlkim-admin-status-helper-style';
  style.textContent = `
    .erlkimStatusGuideBtn {
      position: fixed;
      right: 18px;
      bottom: 74px;
      z-index: 99998;
      border: 3px solid #111827;
      border-radius: 999px;
      background: #ffffff;
      color: #111827;
      font-weight: 900;
      padding: 10px 14px;
      box-shadow: 4px 4px 0 #111827;
      cursor: pointer;
    }

    .erlkimStatusGuidePanel {
      position: fixed;
      right: 18px;
      bottom: 128px;
      z-index: 99998;
      width: min(460px, calc(100vw - 36px));
      max-height: 72vh;
      overflow: auto;
      background: #ffffff;
      border: 3px solid #111827;
      border-radius: 18px;
      box-shadow: 6px 6px 0 #111827;
      padding: 16px;
      color: #111827;
      display: none;
      gap: 10px;
    }

    .erlkimStatusGuidePanel.open {
      display: grid;
    }

    .erlkimStatusGuidePanel h3 {
      margin: 0;
      font-size: 18px;
    }

    .erlkimStatusGuidePanel p {
      margin: 0;
      opacity: .8;
      font-size: 13px;
      line-height: 1.45;
    }

    .erlkimStatusGuideList {
      display: grid;
      gap: 8px;
      margin-top: 6px;
    }

    .erlkimStatusGuideItem {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 10px;
      align-items: start;
      border: 2px solid #111827;
      border-radius: 14px;
      padding: 10px;
      background: #f8fafc;
    }

    .erlkimStatusPill,
    .erlkimStatus-unpaid,
    .erlkimStatus-paid,
    .erlkimStatus-pending,
    .erlkimStatus-processing,
    .erlkimStatus-need_check,
    .erlkimStatus-success,
    .erlkimStatus-failed,
    .erlkimStatus-canceled,
    .erlkimStatus-cancelled {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: fit-content;
      min-height: 24px;
      padding: 3px 9px !important;
      border: 2px solid #111827 !important;
      border-radius: 999px !important;
      font-weight: 900 !important;
      line-height: 1.2 !important;
      box-shadow: 2px 2px 0 #111827 !important;
      text-transform: capitalize;
    }

    .erlkimStatus-unpaid,
    .erlkimStatus-pending,
    .erlkimStatus-need_check,
    .erlkimStatusPill-warning {
      background: #facc15 !important;
      color: #111827 !important;
    }

    .erlkimStatus-paid,
    .erlkimStatus-success,
    .erlkimStatusPill-success {
      background: #22c55e !important;
      color: #052e16 !important;
    }

    .erlkimStatus-processing,
    .erlkimStatusPill-info {
      background: #93c5fd !important;
      color: #111827 !important;
    }

    .erlkimStatus-failed,
    .erlkimStatusPill-danger {
      background: #fca5a5 !important;
      color: #450a0a !important;
    }

    .erlkimStatus-canceled,
    .erlkimStatus-cancelled,
    .erlkimStatusPill-muted {
      background: #e5e7eb !important;
      color: #111827 !important;
    }

    .erlkimStatusGuideClose {
      border: 2px solid #111827;
      border-radius: 12px;
      padding: 10px 12px;
      background: #111827;
      color: #fff;
      font-weight: 900;
      cursor: pointer;
    }

    @media (max-width: 640px) {
      .erlkimStatusGuideBtn {
        right: 10px;
        bottom: 72px;
      }
      .erlkimStatusGuidePanel {
        right: 10px;
        bottom: 124px;
        width: calc(100vw - 20px);
      }
      .erlkimStatusGuideItem {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

function createStatusPill(key: string, meta: StatusMeta) {
  const pill = document.createElement('span');
  pill.className = `erlkimStatusPill erlkimStatusPill-${meta.tone}`;
  pill.textContent = meta.label;
  return pill;
}

function mountStatusGuide() {
  if (document.getElementById('erlkim-status-guide-btn')) return;

  injectAdminStatusStyles();

  const btn = document.createElement('button');
  btn.id = 'erlkim-status-guide-btn';
  btn.type = 'button';
  btn.className = 'erlkimStatusGuideBtn';
  btn.textContent = '📌 Status Guide';

  const panel = document.createElement('div');
  panel.className = 'erlkimStatusGuidePanel';
  panel.innerHTML = `
    <h3>Panduan Status Transaksi</h3>
    <p>Gunakan panduan ini untuk membedakan status pembayaran dan status provider.</p>
    <div class="erlkimStatusGuideList"></div>
    <button class="erlkimStatusGuideClose" type="button">Tutup</button>
  `;

  const list = panel.querySelector('.erlkimStatusGuideList') as HTMLDivElement;

  Object.entries(STATUS_META).forEach(([key, meta]) => {
    if (key === 'cancelled') return;

    const item = document.createElement('div');
    item.className = 'erlkimStatusGuideItem';

    const pill = createStatusPill(key, meta);

    const desc = document.createElement('p');
    desc.textContent = meta.description;

    item.appendChild(pill);
    item.appendChild(desc);
    list.appendChild(item);
  });

  btn.onclick = () => panel.classList.toggle('open');
  panel.querySelector<HTMLButtonElement>('.erlkimStatusGuideClose')!.onclick = () => panel.classList.remove('open');

  document.body.appendChild(btn);
  document.body.appendChild(panel);
}

function enhanceStatusText() {
  const candidates = document.querySelectorAll<HTMLElement>('td, span, small, b, strong, button, div');

  candidates.forEach((el) => {
    if (el.closest('.erlkimStatusGuidePanel') || el.closest('.erlkimStatusGuideBtn')) return;
    if (el.dataset.erlkimStatusEnhanced === '1') return;

    const text = (el.textContent || '').trim();
    if (!text || text.length > 28) return;

    const key = normalizeStatus(text);
    if (!STATUS_META[key]) return;

    el.classList.add(`erlkimStatus-${key}`);
    el.title = `${STATUS_META[key].label}: ${STATUS_META[key].description}`;
    el.dataset.erlkimStatusEnhanced = '1';
  });
}

function bootAdminStatusHelper() {
  mountStatusGuide();
  enhanceStatusText();

  let timer: number | undefined;
  const observer = new MutationObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(enhanceStatusText, 150);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdminStatusHelper, { once: true });
  } else {
    bootAdminStatusHelper();
  }
}
