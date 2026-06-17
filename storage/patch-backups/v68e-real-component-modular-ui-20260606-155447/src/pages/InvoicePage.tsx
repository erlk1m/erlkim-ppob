import { useEffect, useState } from 'react';
import type { Order } from '../types';
import { apiGet } from '../lib/api';
import { money } from '../lib/format';

type Props = {
  invoice: string;
};

export function InvoicePage({ invoice }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await apiGet(`/api/store/orders/${encodeURIComponent(invoice)}`);
        if (alive) setOrder(data);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Invoice tidak ditemukan.');
      }
    }

    load();
    const timer = window.setInterval(load, 10000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [invoice]);

  const status = order?.paymentStatus || order?.payment_status || '-';
  const orderStatus = order?.orderStatus || order?.order_status || '-';
  const total = order?.total || order?.totalAmount || order?.amount || order?.price || 0;
  const qrisPayload = order?.paymentMethod?.qrisPayload || order?.qrisPayload || order?.qris_payload;

  return (
    <main className="invoicePage">
      <section className="panel invoicePanel">
        <p className="eyebrow">Invoice</p>
        <h1>{invoice}</h1>

        {error ? <div className="alert">{error}</div> : null}

        {order ? (
          <>
            <div className="statusGrid">
              <div>
                <span>Pembayaran</span>
                <strong>{status}</strong>
              </div>
              <div>
                <span>Order</span>
                <strong>{orderStatus}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            {qrisPayload ? (
              <div className="paymentBox">
                <strong>QRIS Payload</strong>
                <p>QR visual nanti kita tambahkan lagi secara modular.</p>
                <textarea readOnly value={qrisPayload} />
              </div>
            ) : null}

            <a className="primaryBtn linkBtn" href="/">
              Kembali ke Produk
            </a>
          </>
        ) : (
          <div className="empty">Memuat invoice...</div>
        )}
      </section>
    </main>
  );
}
