import type { Category, PaymentMethod, Product } from '../types';

export const FALLBACK_CATEGORIES: Category[] = [
  { slug: 'pulsa', name: 'Pulsa' },
  { slug: 'paket-data', name: 'Paket Data' },
  { slug: 'token-pln', name: 'Token PLN' },
  { slug: 'emoney', name: 'E-Money' },
  { slug: 'game', name: 'Game' },
  { slug: 'tagihan', name: 'Tagihan' }
];

export function money(value: any) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
}

export function getProductId(product: Product) {
  return product.id || product.productId || product.sku || product.buyerSkuCode || product.buyer_sku_code || '';
}

export function getProductName(product: Product) {
  return product.name || product.productName || product.product_name || product.buyerSkuCode || product.buyer_sku_code || 'Produk';
}

export function getProductPrice(product: Product) {
  return product.sellingPrice || product.selling_price || product.price || 0;
}

export function normalizeCategories(raw: any): Category[] {
  const arr = Array.isArray(raw) ? raw : [];
  const list = arr
    .map((item: any) => {
      if (typeof item === 'string') return { slug: item, name: item };
      const slug = item?.slug || item?.categorySlug || item?.id || item?.key || item?.name;
      const name = item?.name || item?.label || item?.title || slug;
      if (!slug) return null;
      return { slug: String(slug), name: String(name) };
    })
    .filter(Boolean) as Category[];

  return list.length ? list : FALLBACK_CATEGORIES;
}

export function normalizePayments(raw: any): PaymentMethod[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.length ? arr : [{ id: 'manual-qris', code: 'manual-qris', name: 'Manual QRIS' }];
}

export function extractInvoice(order: any) {
  return order?.invoice || order?.invoiceId || order?.invoice_id || order?.refId || order?.ref_id || order?.orderId || order?.id || '';
}
