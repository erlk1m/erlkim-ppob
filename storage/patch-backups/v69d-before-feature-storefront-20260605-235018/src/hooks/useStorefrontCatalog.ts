import { useEffect, useMemo, useState } from 'react';
import type { Category, PaymentMethod, Product } from '../types';
import { apiGet } from '../lib/api';
import { FALLBACK_CATEGORIES, normalizeCategories, normalizePayments } from '../lib/format';

export function useStorefrontCatalog() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('pulsa');
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const selectedPayment = useMemo(() => {
    const first = payments[0];
    return first?.id || first?.code || 'manual-qris';
  }, [payments]);

  useEffect(() => {
    let alive = true;

    async function loadBaseData() {
      const [catRaw, payRaw] = await Promise.all([
        apiGet('/api/categories?audience=storefront').catch(() => FALLBACK_CATEGORIES),
        apiGet('/api/payment-methods').catch(() => [])
      ]);

      if (!alive) return;

      const nextCategories = normalizeCategories(catRaw);

      setCategories(nextCategories);
      setActiveCategory(nextCategories[0]?.slug || 'pulsa');
      setPayments(normalizePayments(payRaw));
    }

    loadBaseData().catch((e) => {
      if (alive) setCatalogError(e?.message || 'Gagal memuat data awal.');
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadProducts() {
      setLoadingProducts(true);
      setCatalogError('');

      try {
        const raw = await apiGet(
          `/api/products?audience=storefront&category=${encodeURIComponent(activeCategory)}&dedupe=true`
        );

        if (!alive) return;
        setProducts(Array.isArray(raw) ? raw : []);
      } catch (e: any) {
        if (!alive) return;
        setProducts([]);
        setCatalogError(e?.message || 'Gagal memuat produk.');
      } finally {
        if (alive) setLoadingProducts(false);
      }
    }

    if (activeCategory) loadProducts();

    return () => {
      alive = false;
    };
  }, [activeCategory]);

  function changeCategory(slug: string) {
    setActiveCategory(slug);
  }

  return {
    categories,
    activeCategory,
    products,
    selectedPayment,
    loadingProducts,
    catalogError,
    changeCategory
  };
}
