type CheckoutPayload = {
  productId?: string;
  customerNo?: string;
  customerNumber?: string;
  customer_no?: string;
  paymentMethod?: string;
  paymentMethodId?: string;
  buyerSkuCode?: string;
  refId?: string;
  [key: string]: unknown;
};

function isCheckoutCreateRequest(input: RequestInfo | URL, init?: RequestInit) {
  const method = String(init?.method || 'GET').toUpperCase();
  if (method !== 'POST') return false;

  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  return (
    /\/store\/orders\/?$/.test(url) ||
    /\/store\/bills\/orders\/?$/.test(url)
  );
}

function parseBody(body: BodyInit | null | undefined): CheckoutPayload | null {
  if (!body || typeof body !== 'string') return null;

  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function maskCustomer(value?: string) {
  const raw = String(value || '').trim();
  if (raw.length <= 6) return raw || '-';
  return `${raw.slice(0, 5)}XXX${raw.slice(-3)}`;
}

function paymentLabel(value?: string) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('midtrans')) return 'Midtrans';
  if (raw.includes('manual') || raw.includes('qris')) return 'Manual QRIS';
  return value || '-';
}

function buildConfirmMessage(payload: CheckoutPayload) {
  const product = payload.productId || payload.buyerSkuCode || '-';
  const customer = payload.customerNo || payload.customerNumber || payload.customer_no || '-';
  const payment = payload.paymentMethodId || payload.paymentMethod || '-';

  return [
    'Konfirmasi buat invoice?',
    '',
    `Produk/SKU: ${product}`,
    `Tujuan: ${maskCustomer(String(customer))}`,
    `Pembayaran: ${paymentLabel(String(payment))}`,
    '',
    'Pastikan produk dan nomor tujuan sudah benar.',
    'Untuk Manual QRIS, bayar sesuai total invoice lalu tunggu admin approve.',
    '',
    'Klik OK untuk lanjut membuat invoice.'
  ].join('\n');
}

function installCheckoutConfirmGuard() {
  if ((window as any).__erlkimCheckoutConfirmGuardInstalled) return;
  (window as any).__erlkimCheckoutConfirmGuardInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (isCheckoutCreateRequest(input, init)) {
      const payload = parseBody(init?.body);

      if (payload) {
        const confirmed = window.confirm(buildConfirmMessage(payload));

        if (!confirmed) {
          throw new Error('Checkout dibatalkan. Invoice tidak dibuat.');
        }
      }
    }

    return originalFetch(input, init);
  };
}

if (typeof window !== 'undefined') {
  installCheckoutConfirmGuard();
}
