function resolveApiUrl() {
  const envUrl = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    const runtimeUrl = String((window as any).__ERLKIM_API_URL__ || '').trim().replace(/\/+$/, '');
    if (runtimeUrl) return runtimeUrl;

    if (host === 'store.erlkim.web.id' || host === 'admin.erlkim.web.id' || host.endsWith('.erlkim.web.id')) {
      return 'https://api.erlkim.web.id/api';
    }

    if (host === 'localhost' || host === '127.0.0.1') {
      return envUrl || `${protocol}//${host}:3001/api`;
    }
  }

  return envUrl || 'https://api.erlkim.web.id/api';
}

const API_URL = resolveApiUrl();

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok === false) throw new Error(json.message || `HTTP ${response.status}`);
  return json.data as T;
}

export function adminHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  type: string;
  isActive: boolean;
};

export type Product = {
  id: string;
  categorySlug: string;
  type: 'prepaid' | 'postpaid';
  brand: string;
  name: string;
  buyerSkuCode: string;
  sellingPrice: number;
  providerPrice: number;
  isActive: boolean;
  isPopular: boolean;
  isFlashsale: boolean;
};

export type PaymentMethod = {
  id: string;
  provider: string;
  name: string;
  merchantName: string;
  adminFee: number;
  qrisImageUrl?: string;
  qrisPayload?: string;
  isEnabled: boolean;
  environment?: string;
};

export type Order = {
  invoice: string;
  refId: string;
  type: 'prepaid' | 'postpaid';
  productName: string;
  buyerSkuCode: string;
  customerNoMasked: string;
  customerName?: string;
  amount: number;
  adminFee: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentProvider?: string;
  midtransRedirectUrl?: string;
  midtransToken?: string;
  midtransStatus?: string;
  midtransOrderId?: string;
  midtransTransactionId?: string;
  midtransPaymentType?: string;
  paymentStatus: string;
  orderStatus: string;
  providerStatus?: string;
  providerRc?: string;
  providerMessage?: string;
  sn?: string;
  createdAt: string;
};
