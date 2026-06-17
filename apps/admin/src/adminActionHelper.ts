const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://api.erlkim.web.id/api').replace(/\/+$/, '');

type InvoiceSummary = {
  invoice?: string;
  paymentStatus?: string;
  orderStatus?: string;
  providerStatus?: string;
  providerRc?: string;
  providerMessage?: string;
  sn?: string;
  paymentMethod?: string;
  totalAmount?: number;
  productName?: string;
  buyerSkuCode?: string;
};

function readToken(): string {
  const keys = ['erlkimAdminToken', 'adminToken', 'ADMIN_TOKEN', 'token', 'authToken'];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && value.length > 10) return value.replace(/^Bearer\s+/i, '');
  }
  return '';
}

function setToken(token: string) {
  if (token && token.length > 10) localStorage.setItem('erlkimAdminToken', token.replace(/^Bearer\s+/i, ''));
}

function rupiah(value?: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function finalStatus(order?: InvoiceSummary) {
  const payment = String(order?.paymentStatus || '').toLowerCase();
  const status = String(order?.orderStatus || '').toLowerCase();
  return ['success', 'failed', 'canceled', 'cancelled'].includes(status)
    || ['expired', 'canceled', 'cancelled', 'failed'].includes(payment);
}

function actionAdvice(order?: InvoiceSummary) {
  if (!order) return 'Masukkan invoice lalu klik Cek Invoice.';

  const payment = String(order.paymentStatus || '').toLowerCase();
  const status = String(order.orderStatus || '').toLowerCase();

  if (status === 'success') return 'Transaksi sudah sukses dan final. Jangan approve ulang.';
  if (status === 'failed') return 'Transaksi gagal dan final. Cek log provider jika perlu.';
  if (status === 'processing' && payment === 'paid') return 'Pembayaran sudah paid dan provider masih proses. Jalankan Check Provider Status.';
  if (status === 'need_check') return 'Status butuh pengecekan. Jalankan Check Provider Status.';
  if (payment === 'unpaid') return 'Belum paid. Kalau QRIS manual sudah benar-benar masuk, baru jalankan Approve Manual QRIS.';
  if (payment === 'paid' && status === 'pending') return 'Paid tapi order masih pending. Jalankan Check Provider Status atau cek log provider.';
  return 'Cek detail order dan provider log sebelum aksi manual.';
}

async function fetchJson(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }
  return json;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  let token = readToken();

  async function run() {
    return fetchJson(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { authorization: `Bearer ${token}` } : {})
      }
    });
  }

  try {
    return await run();
  } catch (error: any) {
    if (!token || /401|403|token|unauthorized|valid/i.test(String(error.message || ''))) {
      const prompted = window.prompt('Masukkan ADMIN_TOKEN:');
      if (prompted) {
        token = prompted.trim();
        setToken(token);
        return await run();
      }
    }
    throw error;
  }
}

function injectActionHelperStyles() {
  if (document.getElementById('erlkim-admin-action-helper-style')) return;

  const style = document.createElement('style');
  style.id = 'erlkim-admin-action-helper-style';
  style.textContent = `
    .erlkimActionHelperBtn {
      position: fixed;
      right: 18px;
      bottom: 130px;
      z-index: 99997;
      border: 3px solid #111827;
      border-radius: 999px;
      background: #93c5fd;
      color: #111827;
      font-weight: 900;
      padding: 10px 14px;
      box-shadow: 4px 4px 0 #111827;
      cursor: pointer;
    }

    .erlkimActionHelperPanel {
      position: fixed;
      right: 18px;
      bottom: 184px;
      z-index: 99997;
      width: min(460px, calc(100vw - 36px));
      max-height: 76vh;
      overflow: auto;
      display: none;
      gap: 10px;
      padding: 16px;
      background: #ffffff;
      color: #111827;
      border: 3px solid #111827;
      border-radius: 18px;
      box-shadow: 6px 6px 0 #111827;
    }

    .erlkimActionHelperPanel.open {
      display: grid;
    }

    .erlkimActionHelperPanel h3 {
      margin: 0;
      font-size: 18px;
    }

    .erlkimActionHelperPanel p {
      margin: 0;
      font-size: 13px;
      line-height: 1.45;
      opacity: .86;
    }

    .erlkimActionHelperPanel input {
      width: 100%;
      border: 2px solid #111827;
      border-radius: 12px;
      padding: 10px;
      font: inherit;
      font-weight: 800;
      text-transform: uppercase;
    }

    .erlkimActionHelperGrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .erlkimActionHelperPanel button {
      border: 2px solid #111827;
      border-radius: 12px;
      padding: 10px 12px;
      font-weight: 900;
      cursor: pointer;
      background: #111827;
      color: #fff;
    }

    .erlkimActionHelperPanel button.warning {
      background: #facc15;
      color: #111827;
    }

    .erlkimActionHelperPanel button.danger {
      background: #fca5a5;
      color: #450a0a;
    }

    .erlkimActionHelperPanel button.ghost {
      background: #fff;
      color: #111827;
    }

    .erlkimActionHelperResult {
      display: grid;
      gap: 6px;
      border: 2px solid #111827;
      border-radius: 14px;
      padding: 10px;
      background: #f8fafc;
      font-size: 13px;
    }

    .erlkimActionHelperResult code {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
    }

    .erlkimActionHelperAdvice {
      border: 2px solid #111827;
      border-radius: 14px;
      padding: 10px;
      background: #fef3c7;
      box-shadow: 3px 3px 0 #111827;
      font-weight: 800;
    }

    @media (max-width: 640px) {
      .erlkimActionHelperBtn {
        right: 10px;
        bottom: 128px;
      }

      .erlkimActionHelperPanel {
        right: 10px;
        bottom: 182px;
        width: calc(100vw - 20px);
      }

      .erlkimActionHelperGrid {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

function renderSummary(order?: InvoiceSummary) {
  if (!order) {
    return `<p>Belum ada data invoice.</p>`;
  }

  return `
    <b>${order.invoice || '-'}</b>
    <span>Produk: ${order.productName || '-'} / ${order.buyerSkuCode || '-'}</span>
    <span>Total: ${rupiah(order.totalAmount)}</span>
    <span>Payment: ${order.paymentStatus || '-'} / ${order.paymentMethod || '-'}</span>
    <span>Order: ${order.orderStatus || '-'}</span>
    <span>Provider: ${order.providerStatus || '-'} ${order.providerRc ? `(${order.providerRc})` : ''}</span>
    <span>SN: ${order.sn || '-'}</span>
    <div class="erlkimActionHelperAdvice">${actionAdvice(order)}</div>
  `;
}

function mountActionHelper() {
  if (document.getElementById('erlkim-action-helper-btn')) return;

  injectActionHelperStyles();

  const btn = document.createElement('button');
  btn.id = 'erlkim-action-helper-btn';
  btn.type = 'button';
  btn.className = 'erlkimActionHelperBtn';
  btn.textContent = '⚙️ Action Helper';

  const panel = document.createElement('div');
  panel.className = 'erlkimActionHelperPanel';
  panel.innerHTML = `
    <h3>Admin Transaction Action Helper</h3>
    <p>Cek invoice dan jalankan aksi aman. Approve manual hanya dipakai kalau QRIS benar-benar sudah masuk.</p>
    <input id="erlkim-action-invoice" placeholder="INV20260604..." />
    <div class="erlkimActionHelperGrid">
      <button id="erlkim-action-check-public" type="button">Cek Invoice</button>
      <button id="erlkim-action-check-status" type="button">Check Provider Status</button>
      <button id="erlkim-action-approve" class="warning" type="button">Approve Manual QRIS</button>
      <button id="erlkim-action-close" class="ghost" type="button">Tutup</button>
    </div>
    <div id="erlkim-action-result" class="erlkimActionHelperResult"><p>Masukkan invoice lalu klik Cek Invoice.</p></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const invoiceInput = panel.querySelector<HTMLInputElement>('#erlkim-action-invoice')!;
  const result = panel.querySelector<HTMLDivElement>('#erlkim-action-result')!;

  function invoice() {
    return invoiceInput.value.trim();
  }

  async function loadInvoice() {
    const inv = invoice();
    if (!inv) throw new Error('Invoice masih kosong');

    result.innerHTML = '<p>Mengambil invoice...</p>';
    const json = await fetchJson(`${API_BASE}/store/orders/${encodeURIComponent(inv)}`);
    const order = json?.data?.order || {};
    result.innerHTML = renderSummary(order);
    return order as InvoiceSummary;
  }

  btn.onclick = () => panel.classList.toggle('open');
  panel.querySelector<HTMLButtonElement>('#erlkim-action-close')!.onclick = () => panel.classList.remove('open');

  panel.querySelector<HTMLButtonElement>('#erlkim-action-check-public')!.onclick = async () => {
    try {
      await loadInvoice();
    } catch (error: any) {
      result.innerHTML = `<p>Gagal: ${error.message || error}</p>`;
    }
  };

  panel.querySelector<HTMLButtonElement>('#erlkim-action-check-status')!.onclick = async () => {
    try {
      const before = await loadInvoice();
      if (finalStatus(before)) {
        result.innerHTML = renderSummary(before) + '<p><b>Skip:</b> Status sudah final.</p>';
        return;
      }

      result.innerHTML = renderSummary(before) + '<p>Menjalankan check status...</p>';

      const inv = invoice();
      const json = await fetchJson(`${API_BASE}/store/orders/${encodeURIComponent(inv)}/check-status`, {
        method: 'POST'
      });

      const updated = json?.data?.order || json?.data || {};
      result.innerHTML = renderSummary(updated);
    } catch (error: any) {
      result.innerHTML = `<p>Gagal check status: ${error.message || error}</p>`;
    }
  };

  panel.querySelector<HTMLButtonElement>('#erlkim-action-approve')!.onclick = async () => {
    try {
      const before = await loadInvoice();

      if (finalStatus(before)) {
        result.innerHTML = renderSummary(before) + '<p><b>Skip:</b> Status sudah final, jangan approve ulang.</p>';
        return;
      }

      if (String(before.paymentStatus || '').toLowerCase() === 'paid') {
        const okPaid = window.confirm('Invoice sudah paid. Jangan approve ulang. Mau lanjut paksa?');
        if (!okPaid) return;
      }

      const ok = window.confirm(`Approve Manual QRIS untuk ${before.invoice}? Pastikan uang QRIS benar-benar sudah masuk.`);
      if (!ok) return;

      result.innerHTML = renderSummary(before) + '<p>Mengirim approve manual...</p>';

      const inv = invoice();
      const json = await adminFetch(`/admin/orders/${encodeURIComponent(inv)}/approve-payment`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      const updated = json?.data?.order || json?.data || {};
      result.innerHTML = renderSummary(updated);
    } catch (error: any) {
      result.innerHTML = `<p>Gagal approve manual: ${error.message || error}</p>`;
    }
  };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountActionHelper, { once: true });
  } else {
    mountActionHelper();
  }
}
