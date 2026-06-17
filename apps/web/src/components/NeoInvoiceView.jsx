import { useEffect, useState } from 'react';
import QrisBox from './QrisBox';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.erlkim.web.id').replace(/\/$/, '');

function buildApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (API_BASE.endsWith('/api') && normalized.startsWith('/api/')) {
    return API_BASE + normalized.slice(4);
  }

  return API_BASE + normalized;
}

function money(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

async function apiGet(path) {
  const res = await fetch(buildApiUrl(path), {
    headers: { Accept: 'application/json' }
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }

  return json;
}


function getInvoiceApiBase() {
  const raw =
    typeof API_BASE !== 'undefined' && API_BASE
      ? String(API_BASE)
      : 'https://api.erlkim.web.id/api';

  const clean = raw.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

function isMidtransMethod(payment, order) {
  const parts = [
    payment?.id,
    payment?.provider,
    payment?.name,
    order?.paymentMethod,
    order?.payment_method,
    order?.paymentProvider,
    order?.payment_provider
  ].map((item) => String(item || '').toLowerCase());

  return parts.some((item) => item.includes('midtrans'));
}



function getInvoiceStatusInsight(order) {
  const paymentStatus = String(order?.paymentStatus || order?.payment_status || '').toLowerCase();
  const orderStatus = String(order?.orderStatus || order?.order_status || '').toLowerCase();
  const providerStatus = String(order?.providerStatus || order?.provider_status || '').toLowerCase();
  const providerRc = String(order?.providerRc || order?.provider_rc || '');
  const sn = String(order?.sn || order?.serialNumber || order?.providerSn || '').trim();

  if (paymentStatus === 'paid' && orderStatus === 'success') {
    return {
      tone: 'success',
      icon: '✅',
      title: 'Transaksi Berhasil',
      message: sn
        ? 'Pembayaran berhasil dan SN sudah diterbitkan.'
        : 'Pembayaran berhasil dan transaksi provider selesai.',
      badge: providerRc === '00' ? 'RC 00' : 'SUKSES'
    };
  }

  if (paymentStatus === 'paid' && ['processing', 'pending'].includes(orderStatus)) {
    return {
      tone: 'warning',
      icon: '⏳',
      title: 'Pembayaran Berhasil, Transaksi Diproses',
      message: providerStatus === 'pending'
        ? 'Pembayaran sudah diterima. Transaksi sedang menunggu hasil akhir dari provider.'
        : 'Pembayaran sudah diterima dan transaksi sedang diproses.',
      badge: 'PROSES'
    };
  }

  if (['unpaid', 'pending', 'waiting_payment', ''].includes(paymentStatus)) {
    return {
      tone: 'info',
      icon: '💳',
      title: 'Menunggu Pembayaran',
      message: 'Silakan selesaikan pembayaran agar transaksi dapat diproses.',
      badge: 'BELUM BAYAR'
    };
  }

  if (['canceled', 'cancelled', 'expired', 'failed'].includes(orderStatus) || ['canceled', 'cancelled', 'expired', 'failed'].includes(paymentStatus)) {
    return {
      tone: 'danger',
      icon: '✖',
      title: 'Transaksi Tidak Berhasil',
      message: 'Invoice sudah dibatalkan, kedaluwarsa, atau gagal diproses.',
      badge: 'GAGAL'
    };
  }

  return {
    tone: 'neutral',
    icon: 'ℹ️',
    title: 'Status Transaksi',
    message: 'Status transaksi sedang diperbarui oleh sistem.',
    badge: 'UPDATE'
  };
}

function formatInvoiceEventTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}


function getDisplayInvoiceEvents(events) {
  if (!Array.isArray(events)) return [];

  const seen = new Set();
  const result = [];

  for (const event of events) {
    const type = String(event?.type || 'unknown').toLowerCase();
    const key = type || 'unknown';

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(event);
  }

  return result;
}

function getInvoiceEventMeta(event) {
  const type = String(event?.type || '').toLowerCase();

  const map = {
    created: {
      icon: '🧾',
      title: 'Invoice Dibuat',
      description: 'Pesanan berhasil dibuat dan menunggu pembayaran.',
      tone: 'neutral'
    },
    'payment-approved': {
      icon: '✅',
      title: 'Pembayaran Disetujui',
      description: 'Pembayaran manual sudah diverifikasi admin.',
      tone: 'success'
    },
    'midtrans-payment-created': {
      icon: '💳',
      title: 'Pembayaran Midtrans Dibuat',
      description: 'Link pembayaran Midtrans berhasil dibuat.',
      tone: 'info'
    },
    'midtrans-webhook': {
      icon: '🔔',
      title: 'Webhook Midtrans Diterima',
      description: 'Sistem menerima notifikasi pembayaran dari Midtrans.',
      tone: 'info'
    },
    'midtrans-paid': {
      icon: '✅',
      title: 'Pembayaran Midtrans Diterima',
      description: 'Pembayaran berhasil dikonfirmasi oleh Midtrans.',
      tone: 'success'
    },
    'provider-transaction': {
      icon: '⚡',
      title: 'Transaksi Provider Berhasil',
      description: 'Transaksi sudah diproses ke provider.',
      tone: 'success'
    },
    'provider-pending': {
      icon: '⏳',
      title: 'Menunggu Provider',
      description: 'Transaksi sedang diproses oleh provider.',
      tone: 'warning'
    },
    canceled: {
      icon: '✖',
      title: 'Transaksi Dibatalkan',
      description: 'Transaksi sudah dibatalkan.',
      tone: 'danger'
    },
    expired: {
      icon: '⌛',
      title: 'Invoice Kedaluwarsa',
      description: 'Batas waktu pembayaran sudah berakhir.',
      tone: 'danger'
    }
  };

  const fallbackTitle = type
    ? type
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Aktivitas';

  return map[type] || {
    icon: '•',
    title: fallbackTitle,
    description: 'Aktivitas tercatat pada sistem invoice.',
    tone: 'neutral'
  };
}

export default function NeoInvoiceView({ invoice, setInvoice, setView }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadInvoice({ silent = false } = {}) {
    if (!invoice) return;

    try {
      if (silent) setRefreshing(true);
      if (!silent) setLoading(true);
      setError('');

      const payload = await apiGet(`/api/store/orders/${encodeURIComponent(invoice)}`);
      setData(payload?.data || payload);
    } catch (err) {
      setError(err?.message || 'Gagal memuat invoice.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [invoice]);

  async function copyText(value) {
    if (!value || value === '-') return;

    try {
      await navigator.clipboard.writeText(String(value));
      alert('Berhasil disalin: ' + value);
    } catch {
      alert('Gagal menyalin.');
    }
  }

  const order = data?.order || {};
  const payment = data?.paymentMethod || data?.payment_method || data?.payment || {};
  const events = Array.isArray(data?.events) ? data.events : [];
  const displayEvents = getDisplayInvoiceEvents(events);
  const statusInsight = getInvoiceStatusInsight(order);

  const invoiceNo = order.invoice || order.id || invoice;
  const refId = order.refId || order.ref_id || '-';

  const paymentStatus = order.paymentStatus || order.payment_status || '-';
  const orderStatus = order.orderStatus || order.order_status || '-';
  const providerStatus = order.providerStatus || order.provider_status || '-';
  const providerRc = order.providerRc || order.provider_rc || '';
  const sn = order.sn || order.serialNumber || order.serial_number || '';

  const productName = order.productName || order.product_name || order.productId || '-';
  const sku = order.buyerSkuCode || order.buyer_sku_code || '';
  const customer =
    order.customerNameMasked ||
    order.customer_name_masked ||
    order.customerName ||
    order.customer_name ||
    order.customerNoMasked ||
    order.customer_no_masked ||
    order.customerNo ||
    order.customer_no ||
    '-';

  const amount = Number(order.amount || 0);
  const adminFee = Number(order.adminFee || order.admin_fee || payment.adminFee || payment.admin_fee || 0);
  const totalAmount = Number(order.totalAmount || order.total_amount || order.total || 0);

  const paymentName = payment.name || payment.provider || order.paymentMethod || order.payment_method || '-';
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [midtransError, setMidtransError] = useState('');
  const invoiceNumber = order.invoice || order.id || data?.invoice || invoice?.invoice || invoice?.id || '';
  const paymentStatusText = String(order.paymentStatus || order.payment_status || '').toLowerCase();
  const canPayWithMidtrans = isMidtransMethod(payment, order) && ['unpaid', 'pending', 'waiting_payment', ''].includes(paymentStatusText);

  async function handleMidtransPayment() {
    if (!invoiceNumber || midtransLoading) return;

    setMidtransError('');
    setMidtransLoading(true);

    try {
      const base = getInvoiceApiBase();
      const res = await fetch(`${base}/store/orders/${encodeURIComponent(invoiceNumber)}/pay/midtrans`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        }
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || 'Gagal membuat pembayaran Midtrans.');
      }

      const redirectUrl =
        json?.data?.midtrans?.redirect_url ||
        json?.data?.midtrans?.redirectUrl ||
        json?.data?.order?.midtransRedirectUrl ||
        json?.data?.redirect_url ||
        json?.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error('Redirect pembayaran Midtrans tidak tersedia.');
      }

      window.location.href = redirectUrl;
    } catch (err) {
      setMidtransError(err?.message || 'Gagal membuka pembayaran Midtrans.');
      setMidtransLoading(false);
    }
  }

  const merchantName = payment.merchantName || payment.merchant_name || '';
  const qrisImage = payment.qrisImageUrl || payment.qris_image_url || '';
  const qrisPayload = payment.qrisPayload || payment.qris_payload || '';

  const isPaid = paymentStatus === 'paid';
  const isSuccess = orderStatus === 'success';

  const dateText = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

  return (
    <div className="invoiceNeoPage">
      <div className="invoiceMarqueeTop no-print">
        <span>ERLKIMPULSA • DIGIFLAZZ INTEGRATION • TOP UP & BILLS • INVOICE SYSTEM • ERLKIMPULSA •</span>
      </div>

      <div className="invoiceMarqueeBottom no-print">
        <span>ERLKIMPULSA • TOP UP & BILLS • DIGIFLAZZ INTEGRATION • NEO BRUTALISM • ERLKIMPULSA •</span>
      </div>

      <div className="invoiceSide invoiceSideLeft no-print">
        <span>ERLKIMPULSA • NEO BRUTALISM • ERLKIMPULSA •</span>
      </div>

      <div className="invoiceSide invoiceSideRight no-print">
        <span>INVOICE SYSTEM • ERLKIMPULSA • INVOICE SYSTEM •</span>
      </div>

      <header className="invoiceTopbar">
        <button
          type="button"
          className="invoiceBrand"
          aria-label="Kembali ke beranda"
          onClick={() => {
            window.history.pushState({}, '', '/');
            setInvoice('');
            if (setView) setView('home');
          }}
        >
          <span>ERLKIM</span>
          <strong>PULSA</strong>
        </button>

        <button
          type="button"
          className="invoicePriceButton"
          aria-label="Daftar Harga"
          onClick={() => {
            window.history.pushState({}, '', '/');
            setInvoice('');
            if (setView) setView('pricelist');
          }}
        >
          Daftar Harga
        </button>
      </header>

      <main className="invoiceShell">
        <section className="invoiceLeft">
          <div className="invoiceHeader">
            <div>
              <h1>Invoice</h1>
              <span className="invoiceBrandBadge">ERLKIMPULSA</span>
            </div>

            <div className="invoiceMeta">
              <strong>{dateText}</strong>
              <span>Invoice: {invoiceNo}</span>
              <small>Ref ID: {refId}</small>
              <b className={isSuccess ? 'statusSuccess' : isPaid ? 'statusPaid' : 'statusPending'}>
                {isSuccess ? 'SUKSES' : isPaid ? 'PAID' : 'UNPAID'}
              </b>
            </div>
          </div>

          {loading ? <div className="invoiceNotice">Memuat invoice...</div> : null}
          {error ? <div className="invoiceError">{error}</div> : null}

          {data ? (
            <>
              <div className="invoiceStatusGrid">
                <div className="invoiceStatusCard yellow">
                  <span>Pembayaran</span>
                  <strong>{paymentStatus}</strong>
                </div>

                <div className="invoiceStatusCard blue">
                  <span>Order</span>
                  <strong>{orderStatus}</strong>
                </div>

                <div className="invoiceStatusCard pink">
                  <span>Total</span>
                  <strong>{totalAmount ? money(totalAmount) : '-'}</strong>
                </div>
              </div>

              <div className="invoiceInfoGrid">
                <div className="invoiceInfoCard">
                  <span className="infoLabel blue">Pelanggan</span>
                  <p>Nomor Tujuan / ID</p>
                  <div className="copyRow">
                    <strong>{customer}</strong>
                    <button type="button" onClick={() => copyText(customer)}>📋</button>
                  </div>
                  <p>Status Transaksi</p>
                  <b className={isSuccess ? 'greenText' : 'blueText'}>{orderStatus}</b>
                </div>

                <div className="invoiceInfoCard">
                  <span className="infoLabel pink">Sistem Digiflazz</span>
                  <p>Ref ID Provider</p>
                  <div className="copyRow">
                    <strong>{refId}</strong>
                    <button type="button" onClick={() => copyText(refId)}>📋</button>
                  </div>
                  <p>Serial Number / SN</p>
                  <div className={`copyRow snCopyRow ${sn ? 'snReady' : 'snWaiting'}`}>
                    <strong>{sn || 'SN belum tersedia'}</strong>
                    {sn ? <button type="button" onClick={() => copyText(sn)}>📋 Salin</button> : null}
                  </div>

                  <p>Provider</p>
                  <div className="providerStatusPill">
                    <b>{providerStatus}{providerRc ? ` / RC ${providerRc}` : ''}</b>
                  </div>
                </div>
              </div>

              <section className={`invoiceStatusInsight invoiceStatus-${statusInsight.tone}`}>
                <div className="invoiceStatusIcon">{statusInsight.icon}</div>
                <div>
                  <div className="invoiceStatusTop">
                    <h2>{statusInsight.title}</h2>
                    <span>{statusInsight.badge}</span>
                  </div>
                  <p>{statusInsight.message}</p>
                </div>
              </section>

              <section className="productDetail">
                <h2>Detail Produk</h2>

                <div className="productTable">
                  <div className="productTableHead">
                    <span>Produk</span>
                    <span>SKU</span>
                    <span>Harga</span>
                  </div>

                  <div className="productTableRow">
                    <div>
                      <strong>{productName}</strong>
                      <small>Produk digital PPOB</small>
                    </div>
                    <strong>{sku || '-'}</strong>
                    <strong>{amount ? money(amount) : '-'}</strong>
                  </div>
                </div>
              </section>

              <section className="invoiceTotalBox">
                <div>
                  <span>Subtotal</span>
                  <strong>{amount ? money(amount) : '-'}</strong>
                </div>

                <div>
                  <span>Biaya Admin</span>
                  <strong>{adminFee ? money(adminFee) : '-'}</strong>
                </div>

                <div className="grandTotal">
                  <span>Total Bayar</span>
                  <strong>{totalAmount ? money(totalAmount) : '-'}</strong>
                </div>
              </section>

              {displayEvents.length ? (
                <section className="invoiceHistory invoiceHistoryPolished">
                  <div className="historyHeader">
                    <div>
                      <h2>Riwayat Transaksi</h2>
                      <p>Alur proses invoice, pembayaran, dan provider.</p>
                    </div>
                    <span>{displayEvents.length} aktivitas</span>
                  </div>

                  <div className="historyTimeline">
                    {displayEvents.map((event, index) => {
                      const meta = getInvoiceEventMeta(event);
                      const eventTime = formatInvoiceEventTime(event.createdAt || event.created_at);

                      return (
                        <div
                          key={event.id || index}
                          className={`historyEvent historyTone-${meta.tone}`}
                        >
                          <div className="historyIcon">{meta.icon}</div>

                          <div className="historyBody">
                            <div className="historyEventTop">
                              <strong>{meta.title}</strong>
                              <time>{eventTime}</time>
                            </div>

                            <p>{meta.description}</p>

                            <small>{event.type || '-'}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="invoiceRight">
          <div>
            <div className="paymentTitle">Metode Pembayaran</div>

            <div className="qrisPanel">
              <div className="tape" />
              <div className="qrisLogoText">QRIS</div>

              {qrisImage || qrisPayload ? (
                <QrisBox
                  imageUrl={qrisImage}
                  payload={qrisPayload}
                  name={paymentName}
                  merchantName={merchantName}
                />
              ) : (
                <p className="qrisEmpty">QRIS belum tersedia.</p>
              )}

              <p className="qrisHelp">Scan menggunakan e-Wallet atau M-Banking.</p>
            </div>
          </div>

          <div className="invoiceActions no-print">
            <button type="button" className="printButton" onClick={() => window.print()}>
              Cetak / Simpan PDF
            </button>

            <button
              type="button"
              className="refreshButton"
              onClick={() => loadInvoice({ silent: true })}
              disabled={refreshing}
            >
              {refreshing ? 'Memuat...' : 'Refresh Status'}
            </button>
          </div>
        </aside>
      </main>

        {canPayWithMidtrans ? (
          <div className="mt-5 border-[3px] border-black bg-[#8C52FF] text-white p-4 shadow-[5px_5px_0px_0px_#000] no-print">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-black uppercase text-lg">Pembayaran Midtrans</p>
                <p className="font-bold text-sm opacity-90">
                  Klik tombol di bawah untuk membuka halaman pembayaran Midtrans.
                </p>
              </div>

              <button
                type="button"
                onClick={handleMidtransPayment}
                disabled={midtransLoading}
                className="bg-[#FFDE59] text-black border-[3px] border-black px-5 py-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
              >
                {midtransLoading ? 'Membuka...' : 'Bayar via Midtrans'}
              </button>
            </div>

            {midtransError ? (
              <p className="mt-3 bg-white text-black border-2 border-black p-2 font-bold">
                {midtransError}
              </p>
            ) : null}
          </div>
        ) : null}
    </div>
  );
}
