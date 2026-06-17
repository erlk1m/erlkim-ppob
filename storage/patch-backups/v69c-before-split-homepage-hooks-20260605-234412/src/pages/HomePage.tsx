import { useEffect, useMemo, useState } from 'react';
import type { Category, PaymentMethod, Product } from '../types';
import { apiGet, apiPost } from '../lib/api';
import {
  FALLBACK_CATEGORIES,
  extractInvoice,
  getProductId,
  normalizeCategories,
  normalizePayments
} from '../lib/format';
import { Hero } from '../components/Hero';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductGrid } from '../components/ProductGrid';
import { CheckoutPanel } from '../components/CheckoutPanel';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [category, setCategory] = useState('pulsa');
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerNo, setCustomerNo] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const selectedPayment = useMemo(() => {
    const first = payments[0];
    return first?.id || first?.code || 'manual-qris';
  }, [payments]);

  useEffect(() => {
    let alive = true;

    async function loadBase() {
      const [catRaw, payRaw] = await Promise.all([
        apiGet('/api/categories?audience=storefront').catch(() => FALLBACK_CATEGORIES),
        apiGet('/api/payment-methods').catch(() => [])
      ]);

      if (!alive) return;

      const nextCategories = normalizeCategories(catRaw);
      setCategories(nextCategories);
      setCategory(nextCategories[0]?.slug || 'pulsa');
      setPayments(normalizePayments(payRaw));
    }

    loadBase().catch((e) => {
      if (alive) setError(e?.message || 'Gagal memuat data awal.');
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const raw = await apiGet(
          `/api/products?audience=storefront&category=${encodeURIComponent(category)}&dedupe=true`
        );

        if (!alive) return;
        setProducts(Array.isArray(raw) ? raw : []);
      } catch (e: any) {
        if (!alive) return;
        setProducts([]);
        setError(e?.message || 'Gagal memuat produk.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (category) loadProducts();

    return () => {
      alive = false;
    };
  }, [category]);

  async function checkout() {
    if (!selectedProduct) {
      setError('Pilih produk dulu.');
      return;
    }

    if (!customerNo.trim()) {
      setError('Masukkan nomor tujuan / ID pelanggan.');
      return;
    }

    const productId = getProductId(selectedProduct);

    if (!productId) {
      setError('Produk tidak punya ID valid.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const order = await apiPost('/api/store/orders', {
        productId,
        customerNo: customerNo.trim(),
        paymentMethod: selectedPayment
      });

      const invoice = extractInvoice(order);
      if (!invoice) throw new Error('Invoice berhasil dibuat tapi nomor invoice tidak ditemukan.');

      location.href = `/invoice/${encodeURIComponent(invoice)}`;
    } catch (e: any) {
      setError(e?.message || 'Gagal membuat invoice.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <main>
      <Hero />

      <CategoryTabs
        categories={categories}
        active={category}
        onChange={(slug) => {
          setCategory(slug);
          setSelectedProduct(null);
        }}
      />

      {error ? <div className="alert">{error}</div> : null}

      <section className="layout">
        <ProductGrid
          category={category}
          products={products}
          selectedProduct={selectedProduct}
          loading={loading}
          onSelect={setSelectedProduct}
        />

        <CheckoutPanel
          selectedProduct={selectedProduct}
          customerNo={customerNo}
          creating={creating}
          onCustomerNoChange={setCustomerNo}
          onCheckout={checkout}
        />
      </section>
    </main>
  );
}
