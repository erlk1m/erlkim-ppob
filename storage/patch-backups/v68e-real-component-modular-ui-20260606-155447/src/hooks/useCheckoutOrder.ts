import { useState } from 'react';
import type { Product } from '../types';
import { apiPost } from '../lib/api';
import { extractInvoice, getProductId } from '../lib/format';

export function useCheckoutOrder(selectedPayment: string) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerNo, setCustomerNo] = useState('');
  const [creating, setCreating] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  function resetSelection() {
    setSelectedProduct(null);
    setCheckoutError('');
  }

  async function checkout() {
    if (!selectedProduct) {
      setCheckoutError('Pilih produk dulu.');
      return;
    }

    if (!customerNo.trim()) {
      setCheckoutError('Masukkan nomor tujuan / ID pelanggan.');
      return;
    }

    const productId = getProductId(selectedProduct);

    if (!productId) {
      setCheckoutError('Produk tidak punya ID valid.');
      return;
    }

    setCreating(true);
    setCheckoutError('');

    try {
      const order = await apiPost('/api/store/orders', {
        productId,
        customerNo: customerNo.trim(),
        paymentMethod: selectedPayment
      });

      const invoice = extractInvoice(order);

      if (!invoice) {
        throw new Error('Invoice berhasil dibuat tapi nomor invoice tidak ditemukan.');
      }

      location.href = `/invoice/${encodeURIComponent(invoice)}`;
    } catch (e: any) {
      setCheckoutError(e?.message || 'Gagal membuat invoice.');
    } finally {
      setCreating(false);
    }
  }

  return {
    selectedProduct,
    customerNo,
    creating,
    checkoutError,
    setSelectedProduct,
    setCustomerNo,
    resetSelection,
    checkout
  };
}
