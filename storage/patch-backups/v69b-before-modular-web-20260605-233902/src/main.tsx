import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Theme = 'halloween' | 'storm';

type Product = {
  id?: string;
  productId?: string;
  sku?: string;
  buyerSkuCode?: string;
  buyer_sku_code?: string;
  name?: string;
  productName?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  categorySlug?: string;
  price?: number;
  sellingPrice?: number;
  selling_price?: number;
  adminFee?: number;
  description?: string;
};

type Category = {
  slug: string;
  name: string;
};

type PaymentMethod = {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  provider?: string;
};

type Order = Record<string, any>;

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3001'
    : 'https://api.erlkim.web.id');

const FALLBACK_CATEGORIES: Category[] = [
  { slug: 'pulsa', name: 'Pulsa' },
  { slug: 'paket-data', name: 'Paket Data' },
  { slug: 'token-pln', name: 'Token PLN' },
  { slug: 'emoney', name: 'E-Money' },
  { slug: 'game', name: 'Game' },
  { slug: 'tagihan', name: 'Tagihan' }
];

function unwrap(input: any): any {
  if (input?.data?.items) return input.data.items;
  if (Array.isArray(input?.data)) return input.data;
  if (input?.data) return input.data;
  if (Array.isArray(input?.items)) return input.items;
  return input;
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' }
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  return unwrap(json);
}

async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  return unwrap(json);
}

function money(value: any) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
}

function getProductId(product: Product) {
  return (
    product.id ||
    product.productId ||
    product.sku ||
    product.buyerSkuCode ||
    product.buyer_sku_code ||
    ''
  );
}

function getProductName(product: Product) {
  return (
    product.name ||
    product.productName ||
    product.product_name ||
    product.buyerSkuCode ||
    product.buyer_sku_code ||
    'Produk'
  );
}

function getProductPrice(product: Product) {
  return product.sellingPrice || product.selling_price || product.price || 0;
}

function normalizeCategories(raw: any): Category[] {
  const arr = Array.isArray(raw) ? raw : [];
  const list = arr
    .map((item: any) => {
      if (typeof item === 'string') {
        return { slug: item, name: item };
      }

      const slug = item?.slug || item?.categorySlug || item?.id || item?.key || item?.name;
      const name = item?.name || item?.label || item?.title || slug;

      if (!slug) return null;
      return {
        slug: String(slug),
        name: String(name)
      };
    })
    .filter(Boolean) as Category[];

  return list.length ? list : FALLBACK_CATEGORIES;
}

function normalizePayments(raw: any): PaymentMethod[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.length
    ? arr
    : [{ id: 'manual-qris', code: 'manual-qris', name: 'Manual QRIS' }];
}

function extractInvoice(order: any) {
  return (
    order?.invoice ||
    order?.invoiceId ||
    order?.invoice_id ||
    order?.refId ||
    order?.ref_id ||
    order?.orderId ||
    order?.id ||
    ''
  );
}

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <div className="themeToggle" aria-label="Pilih tema">
      <button
        type="button"
        aria-label="Tema Halloween"
        aria-pressed={theme === 'halloween'}
        onClick={() => setTheme('halloween')}
      >
        🎃
      </button>
      <button
        type="button"
        aria-label="Tema Hujan Petir"
        aria-pressed={theme === 'storm'}
        onClick={() => setTheme('storm')}
      >
        ⛈️
      </button>
    </div>
  );
}

function Header({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <header className="header">
      <a className="brand" href="/">
        <span className="brandIcon">⚡</span>
        <span>
          <strong>ERLKIM</strong>
          <small>PPOB Store</small>
        </span>
      </a>

      <nav className="nav">
        <a href="/">Produk</a>
        <a href="/cek">Cek Invoice</a>
      </nav>

      <ThemeToggle theme={theme} setTheme={setTheme} />
    </header>
  );
}

function Home() {
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
      try {
        const [catRaw, payRaw] = await Promise.all([
          apiGet('/api/categories?audience=storefront').catch(() => FALLBACK_CATEGORIES),
          apiGet('/api/payment-methods').catch(() => [])
        ]);

        if (!alive) return;
        const nextCategories = normalizeCategories(catRaw);
        setCategories(nextCategories);
        setCategory(nextCategories[0]?.slug || 'pulsa');
        setPayments(normalizePayments(payRaw));
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Gagal memuat data awal.');
      }
    }

    loadBase();
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
        const arr = Array.isArray(raw) ? raw : [];
        setProducts(arr);
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
      <section className="hero">
        <div>
          <p className="eyebrow">PPOB digital cepat</p>
          <h1>Beli pulsa, paket data, token PLN, e-money, game, dan tagihan.</h1>
          <p className="heroText">
            Tampilan baru clean, mobile-first, tanpa theme lama, tanpa tombol dobel.
          </p>
        </div>

        <div className="heroCard">
          <strong>Manual QRIS & Midtrans Ready</strong>
          <span>Produk tersinkron dari API Digiflazz.</span>
        </div>
      </section>

      <section className="panel">
        <div className="sectionHead">
          <h2>Kategori</h2>
          <span>{categories.length} menu</span>
        </div>

        <div className="categoryGrid">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              className={cat.slug === category ? 'active' : ''}
              onClick={() => {
                setCategory(cat.slug);
                setSelectedProduct(null);
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section className="layout">
        <div className="panel productsPanel">
          <div className="sectionHead">
            <h2>Produk</h2>
            <span>{loading ? 'Memuat...' : `${products.length} item`}</span>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          <div className="productGrid">
            {products.map((product) => {
              const id = getProductId(product);
              const active = selectedProduct && getProductId(selectedProduct) === id;

              return (
                <button
                  type="button"
                  key={id || getProductName(product)}
                  className={`productCard ${active ? 'active' : ''}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <span className="productBrand">{product.brand || category}</span>
                  <strong>{getProductName(product)}</strong>
                  <span className="productPrice">{money(getProductPrice(product))}</span>
                </button>
              );
            })}
          </div>

          {!loading && !products.length ? (
            <div className="empty">Produk belum tersedia untuk kategori ini.</div>
          ) : null}
        </div>

        <aside className="panel checkoutPanel">
          <h2>Checkout</h2>

          <label>
            Produk
            <div className="selectedBox">
              {selectedProduct ? (
                <>
                  <strong>{getProductName(selectedProduct)}</strong>
                  <span>{money(getProductPrice(selectedProduct))}</span>
                </>
              ) : (
                <span>Pilih produk dulu</span>
              )}
            </div>
          </label>

          <label>
            Nomor tujuan / ID pelanggan
            <input
              value={customerNo}
              onChange={(e) => setCustomerNo(e.target.value)}
              placeholder="Contoh: 081234567890"
            />
          </label>

          <button className="primaryBtn" type="button" disabled={creating} onClick={checkout}>
            {creating ? 'Membuat invoice...' : 'Buat Invoice'}
          </button>
        </aside>
      </section>
    </main>
  );
}

function InvoicePage({ invoice }: { invoice: string }) {
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
                <p>Gunakan payload ini untuk generate QRIS. QR visual bisa kita tambahkan lagi nanti secara clean.</p>
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

function CheckPage() {
  const [value, setValue] = useState('');

  return (
    <main className="invoicePage">
      <section className="panel invoicePanel">
        <p className="eyebrow">Cek Invoice</p>
        <h1>Cari status transaksi</h1>
        <label>
          Nomor invoice
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="INV..." />
        </label>
        <button
          className="primaryBtn"
          type="button"
          onClick={() => {
            if (value.trim()) location.href = `/invoice/${encodeURIComponent(value.trim())}`;
          }}
        >
          Cek Sekarang
        </button>
      </section>
    </main>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('erlkim-fresh-theme');
    return saved === 'storm' ? 'storm' : 'halloween';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('erlkim-fresh-theme', theme);
  }, [theme]);

  const path = location.pathname;
  const invoiceMatch = path.match(/^\/invoice\/([^/]+)/);

  return (
    <>
      <div className="weatherLayer" aria-hidden="true" />
      <Header theme={theme} setTheme={setTheme} />
      {invoiceMatch ? (
        <InvoicePage invoice={decodeURIComponent(invoiceMatch[1])} />
      ) : path === '/cek' ? (
        <CheckPage />
      ) : (
        <Home />
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
