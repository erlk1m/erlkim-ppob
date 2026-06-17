import React, { useEffect, useMemo, useState } from 'react';
import NeoInvoiceView from './components/NeoInvoiceView';
import QrisBox from './components/QrisBox';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.erlkim.web.id').replace(/\/$/, '');

const WHATSAPP_NUMBER = '62816262972';

function whatsappUrl(phone = WHATSAPP_NUMBER) {
  const text = encodeURIComponent('Halo, saya butuh bantuan.');
  return `https://wa.me/${phone}?text=${text}`;
}


const CATEGORY_META = {
  pulsa: { icon: '📱', color: 'bg-[#FFDE59]' },
  'paket-data': { icon: '🌐', color: 'bg-[#00FF00]' },
  data: { icon: '🌐', color: 'bg-[#00FF00]' },
  'token-pln': { icon: '⚡', color: 'bg-[#FF90E8]' },
  pln: { icon: '⚡', color: 'bg-[#FF90E8]' },
  game: { icon: '🎮', color: 'bg-[#00FFFF]' },
  emoney: { icon: '💳', color: 'bg-[#FF5757]' },
  tagihan: { icon: '🧾', color: 'bg-[#8C52FF]' },
  tv: { icon: '📺', color: 'bg-[#00FFFF]' },
  streaming: { icon: '🎬', color: 'bg-[#FF90E8]' },
  esim: { icon: '📶', color: 'bg-[#00FF00]' },
  'paket-sms-telpon': { icon: '☎️', color: 'bg-[#FFDE59]' },
  'masa-aktif': { icon: '⏳', color: 'bg-[#FF90E8]' },
  'aktivasi-perdana': { icon: '🪪', color: 'bg-[#00FFFF]' },
  'aktivasi-voucher': { icon: '🎟️', color: 'bg-[#FF5757]' }
};

const COLOR_POOL = ['bg-[#FFDE59]', 'bg-[#00FF00]', 'bg-[#FF90E8]', 'bg-[#00FFFF]', 'bg-[#FF5757]', 'bg-[#8C52FF]'];

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.categories)) return payload.categories;
  return [];
}

function decorateCategory(cat, index = 0) {
  const slug = String(cat.slug || cat.id || cat.code || cat.key || cat.categorySlug || '').trim();
  const name = String(cat.name || cat.label || cat.title || titleCase(slug)).trim();
  const meta = CATEGORY_META[slug] || {};

  return slug
    ? {
        id: slug,
        slug,
        name,
        icon: cat.icon || meta.icon || '🛒',
        color: cat.color || meta.color || COLOR_POOL[index % COLOR_POOL.length]
      }
    : null;
}

function normalizeCategories(payload) {
  return normalizeArray(payload)
    .map((item, index) => {
      if (typeof item === 'string') return decorateCategory({ slug: item, name: titleCase(item) }, index);
      return decorateCategory(item, index);
    })
    .filter(Boolean);
}

function getProductId(product) {
  return String(
    product?.id ||
      product?.productId ||
      product?.product_id ||
      product?.slug ||
      product?.code ||
      product?.buyerSkuCode ||
      product?.buyer_sku_code ||
      product?.sku ||
      product?.providerCode ||
      product?.provider_code ||
      ''
  );
}

function getProductSku(product) {
  return String(
    product?.buyerSkuCode ||
      product?.buyer_sku_code ||
      product?.sku ||
      product?.providerCode ||
      product?.provider_code ||
      product?.code ||
      product?.id ||
      ''
  );
}

function getProductName(product) {
  return String(
    product?.name ||
      product?.productName ||
      product?.product_name ||
      product?.title ||
      product?.description ||
      getProductId(product) ||
      'Produk'
  );
}

function getProductProvider(product, fallback = 'PPOB') {
  return String(product?.brand || product?.operator || product?.provider || product?.category || fallback || 'PPOB');
}

function getProductPrice(product) {
  return Number(
    product?.sellingPrice ??
      product?.selling_price ??
      product?.price ??
      product?.amount ??
      product?.nominal ??
      0
  );
}


function isFlashSaleProduct(product) {
  return Boolean(
    product?.isFlashsale ||
      product?.is_flashsale ||
      product?.flashsale ||
      product?.flashSale ||
      product?.isFlashSale
  );
}

function money(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}


function buildCheckoutConfirmationText(product, paymentMethod, total) {
  const lines = [
    'Konfirmasi pesanan sebelum invoice dibuat:',
    '',
    `Produk: ${getProductName(product)}`,
    `Nomor tujuan: ${product?.targetNumber || '-'}`,
  ];

  if (product?.detectedOperator) {
    lines.push(`Operator: ${product.detectedOperator}`);
  }

  if (product?.selectedEmoneyProvider) {
    lines.push(`Wallet: ${product.selectedEmoneyProvider}`);
  }

  if (product?.plnInquiry) {
    const plnName =
      product.plnInquiry.customerName ||
      product.plnInquiry.name ||
      product.plnInquiry.customerNameMasked ||
      'Data PLN tersedia';

    lines.push(`Data PLN: ${plnName}`);
    if (product.plnInquiry.segmentPower) {
      lines.push(`Daya PLN: ${product.plnInquiry.segmentPower}`);
    }
  }

  lines.push(
    `Metode bayar: ${paymentMethod?.name || paymentMethod?.id || '-'}`,
    `Harga produk: ${money(getProductPrice(product))}`,
    `Admin fee: ${money(paymentMethod?.adminFee || 0)}`,
    `Total bayar: ${money(total)}`,
    '',
    'Lanjut buat invoice?'
  );

  return lines.join('\n');
}



const OPERATOR_PREFIXES = [
  {
    id: 'telkomsel',
    label: 'Telkomsel',
    prefixes: ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'],
    aliases: ['telkomsel', 'tsel', 'simpati', 'kartu as', 'byu', 'by u']
  },
  {
    id: 'indosat',
    label: 'Indosat',
    prefixes: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
    aliases: ['indosat', 'im3', 'isat', 'mentari']
  },
  {
    id: 'xl',
    label: 'XL',
    prefixes: ['0817', '0818', '0819', '0859', '0877', '0878'],
    aliases: ['xl', 'axiata']
  },
  {
    id: 'axis',
    label: 'Axis',
    prefixes: ['0831', '0832', '0833', '0838'],
    aliases: ['axis']
  },
  {
    id: 'tri',
    label: 'Tri',
    prefixes: ['0895', '0896', '0897', '0898', '0899'],
    aliases: ['tri', 'three']
  },
  {
    id: 'smartfren',
    label: 'Smartfren',
    prefixes: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
    aliases: ['smartfren', 'smart']
  }
];

function normalizeIndonesianMsisdn(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('62')) digits = `0${digits.slice(2)}`;
  if (digits.startsWith('8')) digits = `0${digits}`;

  return digits;
}

function detectOperatorFromNumber(value) {
  const number = normalizeIndonesianMsisdn(value);

  if (number.length < 4) return null;

  return OPERATOR_PREFIXES.find((operator) =>
    operator.prefixes.some((prefix) => number.startsWith(prefix))
  ) || null;
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductSearchText(product, fallback = '') {
  return normalizeSearchText([
    product?.brand,
    product?.operator,
    product?.provider,
    product?.category,
    product?.categorySlug,
    product?.type,
    product?.name,
    product?.productName,
    product?.product_name,
    product?.title,
    product?.description,
    product?.buyerSkuCode,
    product?.buyer_sku_code,
    product?.sku,
    product?.providerCode,
    product?.provider_code,
    product?.code,
    fallback
  ].filter(Boolean).join(' '));
}

function productMatchesOperator(product, operator) {
  if (!operator?.id) return true;

  const text = getProductSearchText(product);
  if (!text) return false;

  if (operator.id === 'xl') {
    return /\bxl\b/.test(text) || text.includes('axiata');
  }

  if (operator.id === 'tri') {
    return /\btri\b/.test(text) || /\bthree\b/.test(text);
  }

  return operator.aliases.some((alias) => {
    const normalizedAlias = normalizeSearchText(alias);
    return normalizedAlias ? text.includes(normalizedAlias) : false;
  });
}

function isOperatorFilteredCategory(categoryId) {
  return ['pulsa', 'paket-data', 'data'].includes(String(categoryId || '').toLowerCase());
}


const EMONEY_PROVIDERS = [
  {
    id: 'dana',
    label: 'DANA',
    aliases: ['dana']
  },
  {
    id: 'ovo',
    label: 'OVO',
    aliases: ['ovo']
  },
  {
    id: 'gopay',
    label: 'GoPay',
    aliases: ['gopay', 'go pay', 'go-pay', 'gojek']
  },
  {
    id: 'shopeepay',
    label: 'ShopeePay',
    aliases: ['shopeepay', 'shopee pay', 'shopee-pay', 'spay']
  },
  {
    id: 'linkaja',
    label: 'LinkAja',
    aliases: ['linkaja', 'link aja', 'link-aja']
  },
  {
    id: 'doku',
    label: 'DOKU',
    aliases: ['doku']
  }
];

function isEmoneyCategory(categoryId) {
  return ['emoney', 'e-money', 'e_money'].includes(String(categoryId || '').toLowerCase());
}

function getEmoneyProviderById(id) {
  return EMONEY_PROVIDERS.find((provider) => provider.id === String(id || '').toLowerCase()) || null;
}

function productMatchesEmoneyProvider(product, provider) {
  if (!provider?.id) return true;

  const text = getProductSearchText(product);
  if (!text) return false;

  return provider.aliases.some((alias) => {
    const normalizedAlias = normalizeSearchText(alias);
    return normalizedAlias ? text.includes(normalizedAlias) : false;
  });
}



function normalizePaymentMethods(payload) {
  const arr = normalizeArray(payload);
  const mapped = arr
    .map((item, index) => {
      const id = String(item.id || item.code || item.slug || item.method || item.name || '').trim();
      if (!id) return null;

      return {
        id,
        name: item.name || item.label || titleCase(id),
        adminFee: Number(item.adminFee ?? item.admin_fee ?? item.fee ?? 0),
        color: item.color || COLOR_POOL[index % COLOR_POOL.length]
      };
    })
    .filter(Boolean);

  return mapped.length
    ? mapped
    : [
        { id: 'manual-qris', name: 'QRIS Manual', adminFee: 0, color: 'bg-[#FFDE59]' },
        { id: 'midtrans-snap', name: 'Midtrans', adminFee: 0, color: 'bg-[#8C52FF]' }
      ];
}

function extractInvoice(payload) {
  const invoiceKeys = new Set([
    'invoice',
    'invoiceNo',
    'invoice_no',
    'invoiceNumber',
    'invoice_number',
    'refId',
    'ref_id',
    'orderId',
    'order_id'
  ]);

  const found = [];

  function walk(value, depth = 0) {
    if (!value || depth > 6) return;

    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, depth + 1));
      return;
    }

    if (typeof value !== 'object') return;

    Object.entries(value).forEach(([key, val]) => {
      if (invoiceKeys.has(key) && typeof val === 'string' && val.trim()) {
        found.push(val.trim());
      }

      if (val && typeof val === 'object') {
        walk(val, depth + 1);
      }
    });
  }

  walk(payload);

  const invoice =
    found.find((value) => /^(INV|BILL|LS)-/i.test(value)) ||
    found.find((value) => /^(INV|BILL|LS)/i.test(value)) ||
    found[0] ||
    '';

  return String(invoice || '').trim();
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }

  return json;
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }

  return json;
}

async function fetchCategories() {
  const payload = await apiGet('/api/categories?audience=storefront');
  return normalizeCategories(payload);
}



function normalizeMidtransReturnInvoice(value) {
  const invoice = String(value || '').trim().replace(/[^a-zA-Z0-9-]/g, '');
  if (!invoice) return '';
  if (!/^(INV|BILL)/i.test(invoice)) return '';
  return invoice;
}

function handleMidtransReturnRedirect() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search || '');
  const orderId = normalizeMidtransReturnInvoice(params.get('order_id') || params.get('orderId'));
  const transactionStatus = String(params.get('transaction_status') || '').trim();
  const statusCode = String(params.get('status_code') || '').trim();

  if (!orderId || (!transactionStatus && !statusCode)) return false;

  const currentPath = window.location.pathname || '/';
  const targetPath = `/invoice/${encodeURIComponent(orderId)}`;
  const targetQuery = new URLSearchParams();

  targetQuery.set('from', 'midtrans');
  if (transactionStatus) targetQuery.set('transaction_status', transactionStatus);
  if (statusCode) targetQuery.set('status_code', statusCode);

  const targetUrl = `${targetPath}?${targetQuery.toString()}`;

  if (currentPath !== targetPath) {
    window.location.replace(targetUrl);
    return true;
  }

  return false;
}


const DEFAULT_HOME_CONTENT = {
  brandName: 'ERLKIM PULSA',
  heroTitle: 'Top Up & PPOB Digital',
  heroSubtitle: 'Pulsa, paket data, token PLN, e-money, game, tagihan, dan produk digital lain dalam satu tempat.',
  runningText: 'Transaksi diproses otomatis setelah pembayaran terverifikasi.',
  featuredTitle: 'Produk Pilihan',
  featuredSubtitle: 'Produk populer dari katalog ERLKIM.',
  categoryTitle: '🛒 Kategori Produk',
  whatsappLabel: 'Hubungi CS WhatsApp',
  whatsappNumber: '',
  footerText: '© ERLKIM PULSA',
  bannerImageUrl: '/banners/home-banner.svg'
};


function getStoreApiBase() {
  const raw =
    typeof API_BASE !== 'undefined' && API_BASE
      ? String(API_BASE)
      : 'https://api.erlkim.web.id/api';

  const clean = raw.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

async function fetchHomeContent() {
  try {
    const base = getStoreApiBase();

    const res = await fetch(`${base}/store/home-content`, {
      cache: 'no-store',
      headers: {
        accept: 'application/json'
      }
    });

    if (!res.ok) return DEFAULT_HOME_CONTENT;

    const json = await res.json();
    const data = json?.data || {};

    return {
      ...DEFAULT_HOME_CONTENT,
      ...data,
      bannerImageUrl: String(data.bannerImageUrl || DEFAULT_HOME_CONTENT.bannerImageUrl).trim()
    };
  } catch {
    return DEFAULT_HOME_CONTENT;
  }
}

async function fetchProducts(categoryId) {
  const query = new URLSearchParams({ audience: 'storefront', category: categoryId, dedupe: 'true' });
  const payload = await apiGet(`/api/products?${query.toString()}`);
  return normalizeArray(payload);
}

async function fetchPaymentMethods() {
  const payload = await apiGet('/api/payment-methods');
  return normalizePaymentMethods(payload);
}


async function inquiryPlnCustomer(customerNo) {
  return apiPost('/api/store/orders/pln/inquiry', { customerNo });
}

function isTokenPlnCategory(categoryId) {
  return ['token-pln', 'pln', 'token_pln'].includes(String(categoryId || '').toLowerCase());
}

function normalizePlnCustomerNo(value) {
  return String(value || '').replace(/\D/g, '').trim();
}


const BrutalCard = ({ children, color = 'bg-white', className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`${color} border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_#000]
    ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_#000]' : ''}
    transition-all duration-200 ${className}`}
  >
    {children}
  </div>
);

const BrutalButton = ({ children, color = 'bg-[#FF90E8]', className = '', onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${color} text-black font-black uppercase tracking-wider border-[3px] border-black py-3 px-6
    shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]
    active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_#000]
    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${className}`}
  >
    {children}
  </button>
);

const BrutalInput = ({ placeholder, value, onChange, type = 'text', className = '' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full bg-white border-[3px] border-black p-4 text-lg font-bold
    shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#FF90E8]
    transition-all ${className}`}
  />
);

const Navbar = ({ setView, brandName = 'ERLKIM PULSA' }) => {
  const parts = brandName.split(' ');
  const part1 = parts[0] || 'ERLKIM';
  const part2 = parts.slice(1).join(' ') || 'PULSA';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-[3px] border-black shadow-[0px_4px_0px_0px_#000]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div
          className="text-2xl md:text-3xl font-black tracking-tighter cursor-pointer flex items-center gap-2"
          onClick={() => setView('home')}
        >
          <span className="bg-[#00FF00] border-2 border-black px-2 py-1 transform -rotate-2">{part1}</span>
          {part2 && <span className="transform rotate-2">{part2}</span>}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setView('pricelist')}
            className="hidden md:block font-bold border-2 border-black px-4 py-1 bg-[#FFDE59] hover:bg-[#FF90E8] transition-colors shadow-[2px_2px_0px_0px_#000]"
          >
            Daftar Harga
          </button>
          <button
            onClick={() => setView('pricelist')}
            className="md:hidden font-bold border-2 border-black px-2 py-1 bg-[#FFDE59] shadow-[2px_2px_0px_0px_#000]"
          >
            Harga
          </button>
        </div>
      </div>
    </nav>
  );
};

const MarqueeBanner = ({ text }) => {
  if (!text) return null;
  // Ensure monochrome heart is rendered as emoji (❤️) so it doesn't just inherit text color
  const coloredText = text.replace(/❤/g, '❤️');
  return (
    <div className="bg-black text-white border-b-[3px] border-black py-2 overflow-hidden relative flex">
      <div className="whitespace-nowrap animate-marquee flex gap-8 font-bold uppercase tracking-widest text-sm md:text-base">
        <span>{coloredText}</span>
        <span>{coloredText}</span>
        <span>{coloredText}</span>
        <span>{coloredText}</span>
        <span>{coloredText}</span>
      </div>
    </div>
  );
};


const HomeBanner = ({ title, subtitle, runningText, imageUrl }) => {
  const fallbackBanner = DEFAULT_HOME_CONTENT.bannerImageUrl || '/banners/home-banner.svg';
  const [resolvedImageUrl, setResolvedImageUrl] = useState(imageUrl || fallbackBanner);

  useEffect(() => {
    setResolvedImageUrl(imageUrl || fallbackBanner);
  }, [imageUrl, fallbackBanner]);

  useEffect(() => {
    let alive = true;

    const loadBanner = async () => {
      try {
        const base = getStoreApiBase();

        const res = await fetch(`${base}/store/home-content?ts=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            accept: 'application/json'
          }
        });

        if (!res.ok) return;

        const json = await res.json();
        const next = String(json?.data?.bannerImageUrl || '').trim();

        if (alive && next) {
          setResolvedImageUrl(next);
        }
      } catch (_) {
        // keep fallback banner
      }
    };

    loadBanner();

    return () => {
      alive = false;
    };
  }, []);

  const finalImageUrl = resolvedImageUrl || fallbackBanner;

  return (
    <section className="relative">
      <div
        className="relative bg-[#FFFDF0] border-[4px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
        style={{
          backgroundImage: "url('/banners/home-banner.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <img
          src={finalImageUrl}
          data-banner-src={finalImageUrl}
          alt="ERLKIM PULSA Topup dan PPOB"
          className="w-full block"
          loading="eager"
          decoding="async"
          onError={(event) => {
            if (event.currentTarget.src.includes('/banners/home-banner.svg')) return;
            event.currentTarget.src = '/banners/home-banner.svg';
          }}
        />
      </div>
    </section>
  );
};



const FeaturedProductCard = ({ item, onClick, duplicate = false }) => (
  <BrutalCard
    color="bg-[#FFFDF0]"
    className={`featuredAutoCard ${duplicate ? 'featuredDuplicate' : ''}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-3xl">{item.categoryIcon}</span>
      <span className="bg-[#FF5757] text-white font-bold px-2 py-1 border-2 border-black text-[10px] md:text-xs animate-pulse">
        API READY
      </span>
    </div>
    <h3 className="font-black text-base md:text-lg mb-2 leading-tight line-clamp-2">{getProductName(item)}</h3>
    <div className="flex flex-col">
      <span className="text-gray-700 font-bold text-xs md:text-sm uppercase">{getProductProvider(item, item.categoryName)}</span>
      <span className="text-xl md:text-2xl font-black text-[#00FF00] drop-shadow-[1px_1px_0px_#000]">
        {money(getProductPrice(item))}
      </span>
    </div>
  </BrutalCard>
);


const HomeView = ({ categories, featuredProducts, flashsaleProducts, homeContent, loading, error, setView, setSelectedCategory, setSelectedProduct }) => {
  const content = { ...DEFAULT_HOME_CONTENT, ...(homeContent || {}) };
  const homeHeroTitle = content.heroTitle || DEFAULT_HOME_CONTENT.heroTitle;
  const homeHeroSubtitle = content.heroSubtitle || DEFAULT_HOME_CONTENT.heroSubtitle;
  const homeRunningText = content.runningText || DEFAULT_HOME_CONTENT.runningText;
  const homeFeaturedTitle = content.featuredTitle || DEFAULT_HOME_CONTENT.featuredTitle;
  const homeFeaturedSubtitle = content.featuredSubtitle || DEFAULT_HOME_CONTENT.featuredSubtitle;
  const homeFlashsaleProducts = Array.isArray(flashsaleProducts) ? flashsaleProducts : [];
  const homeBannerImageUrl = content.bannerImageUrl || DEFAULT_HOME_CONTENT.bannerImageUrl;

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setView('product');
  };

  const handleFeaturedClick = (item) => {
    setSelectedCategory(item.categoryId);
    setSelectedProduct(null);
    setView('product');
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in">
      <HomeBanner
        title={homeHeroTitle}
        subtitle={homeHeroSubtitle}
        runningText={homeRunningText}
        imageUrl={homeBannerImageUrl}
      />

      <section>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-3xl md:text-4xl font-black uppercase bg-[#FF5757] text-white border-[3px] border-black px-4 py-2 inline-block transform -rotate-1 shadow-[4px_4px_0px_0px_#000]">
            ⚡ {homeFeaturedTitle}
          </h2>
          <div className="bg-black text-white font-mono font-bold px-3 py-1 border-[3px] border-black">
            LIVE API
          </div>
        </div>

        {error ? (
          <div className="bg-[#FF5757] text-white border-[3px] border-black p-4 font-black shadow-[4px_4px_0px_0px_#000]">
            {error}
          </div>
        ) : null}

        {homeFlashsaleProducts.length ? (
          <section className="flashSaleHomeSection" data-v80b="V80B_STORE_FLASHSALE_DISPLAY_SAFE">
            <div className="flashSaleHomeTop">
              <div>
                <span>FLASH SALE</span>
                <h2>Promo Terbatas</h2>
                <p>Produk bertanda flashsale dari Admin tampil otomatis di homepage.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(homeFlashsaleProducts[0]?.categoryId || homeFlashsaleProducts[0]?.categorySlug || homeFlashsaleProducts[0]?.category || 'pulsa');
                  setView('products');
                }}
              >
                Lihat Semua
              </button>
            </div>

            <div className="flashSaleHomeGrid">
              {homeFlashsaleProducts.slice(0, 8).map((item, index) => {
                const categoryId = item.categoryId || item.categorySlug || item.category || item.type || 'pulsa';

                return (
                  <button
                    type="button"
                    key={`${getProductId(item) || getProductSku(item) || index}-flashsale`}
                    className="flashSaleHomeCard"
                    onClick={() => {
                      setSelectedCategory(categoryId);
                      setSelectedProduct({ ...item, categoryId });
                      setView('checkout');
                    }}
                  >
                    <small>{getProductProvider(item, item.categoryName || titleCase(categoryId))}</small>
                    <b>{getProductName(item)}</b>
                    <span>{money(getProductPrice(item))}</span>
                    <em>Ambil promo</em>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="featuredAutoWrap -mx-4 px-4 md:mx-0 md:px-0">
          <div
            className="featuredAutoTrack"
            style={{ '--featured-count': featuredProducts.length || 1 }}
          >
            {loading && !featuredProducts.length ? (
              <BrutalCard color="bg-[#FFFDF0]" className="featuredAutoCard md:col-span-3 font-black text-xl text-center">
                Memuat produk dari API...
              </BrutalCard>
            ) : null}

            {[...featuredProducts, ...featuredProducts].map((item, index) => (
              <FeaturedProductCard
                key={`${item.categoryId}-${getProductId(item)}-${index}`}
                item={item}
                duplicate={index >= featuredProducts.length}
                onClick={() => handleFeaturedClick(item)}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl md:text-4xl font-black uppercase bg-[#00FFFF] border-[3px] border-black px-4 py-2 inline-block shadow-[4px_4px_0px_0px_#000]">
            {content.categoryTitle || '🛒 Kategori Produk'}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.id)}
              className={`${cat.color} group relative min-h-[150px] md:min-h-[180px] border-[4px] border-black p-4 md:p-5 shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[3px_3px_0px_0px_#000] transition-all overflow-hidden text-center flex flex-col items-center justify-center`}
            >
              <span className="absolute top-2 right-2 bg-white border-2 border-black px-2 py-1 text-[10px] font-black">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="absolute -bottom-8 -right-8 w-20 h-20 bg-white/35 border-[3px] border-black rounded-full group-hover:scale-125 transition-transform" />

              <span className="relative text-5xl md:text-6xl mb-4 drop-shadow-[3px_3px_0px_#000] group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>

              <span className="relative font-black text-sm md:text-base uppercase leading-tight bg-white border-2 border-black px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const ProductView = ({ categoryId, categories, setView, setSelectedProduct }) => {
  const [targetNumber, setTargetNumber] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plnInquiry, setPlnInquiry] = useState(null);
  const [plnInquiryLoading, setPlnInquiryLoading] = useState(false);
  const [plnInquiryError, setPlnInquiryError] = useState('');
  const [selectedEmoneyProvider, setSelectedEmoneyProvider] = useState('');

  const category = categories.find((c) => c.id === categoryId) || categories[0];
  const detectedOperator = useMemo(() => detectOperatorFromNumber(targetNumber), [targetNumber]);
  const operatorFilterActive = isOperatorFilteredCategory(category?.id) && Boolean(detectedOperator);
  const selectedEmoneyProviderInfo = useMemo(
    () => getEmoneyProviderById(selectedEmoneyProvider),
    [selectedEmoneyProvider]
  );
  const emoneyFilterActive = isEmoneyCategory(category?.id) && Boolean(selectedEmoneyProviderInfo);
  const activeFilterLabel = selectedEmoneyProviderInfo?.label || detectedOperator?.label || 'filter ini';

  const visibleProducts = useMemo(() => {
    let next = products;

    if (operatorFilterActive) {
      next = next.filter((product) => productMatchesOperator(product, detectedOperator));
    }

    if (emoneyFilterActive) {
      next = next.filter((product) => productMatchesEmoneyProvider(product, selectedEmoneyProviderInfo));
    }

    return next;
  }, [products, operatorFilterActive, detectedOperator?.id, emoneyFilterActive, selectedEmoneyProviderInfo?.id]);

  useEffect(() => {
    if (!isEmoneyCategory(category?.id)) {
      setSelectedEmoneyProvider('');
    }
  }, [category?.id]);

  useEffect(() => {
    if (!isTokenPlnCategory(category?.id)) {
      setPlnInquiry(null);
      setPlnInquiryError('');
      setPlnInquiryLoading(false);
      return;
    }

    const customerNo = normalizePlnCustomerNo(targetNumber);

    setPlnInquiry(null);
    setPlnInquiryError('');

    if (!customerNo || customerNo.length < 6) {
      setPlnInquiryLoading(false);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      try {
        setPlnInquiryLoading(true);
        setPlnInquiryError('');

        const payload = await inquiryPlnCustomer(customerNo);
        const data = payload?.data || payload;

        if (!alive) return;

        if (!data?.valid) {
          setPlnInquiry(null);
          setPlnInquiryError(payload?.message || data?.message || 'ID pelanggan PLN tidak valid.');
          return;
        }

        setPlnInquiry({ ...data, customerNo });
      } catch (err) {
        if (!alive) return;
        setPlnInquiry(null);
        setPlnInquiryError(err?.message || 'Gagal cek nama PLN.');
      } finally {
        if (alive) setPlnInquiryLoading(false);
      }
    }, 700);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [category?.id, targetNumber]);

  useEffect(() => {
    if (!category?.id) return;

    let alive = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError('');
        const next = await fetchProducts(category.id);
        if (alive) setProducts(next);
      } catch (err) {
        if (alive) {
          setProducts([]);
          setError(err?.message || 'Gagal memuat produk.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      alive = false;
    };
  }, [category?.id]);

  const handleProductSelect = (product) => {
    const normalizedTarget = normalizeIndonesianMsisdn(targetNumber);

    if (!normalizedTarget) return;

    if (isTokenPlnCategory(category?.id)) {
      if (plnInquiryLoading) {
        setError('Tunggu proses cek nama PLN selesai.');
        return;
      }

      if (!plnInquiry?.valid || String(plnInquiry.customerNo || '') !== normalizedTarget) {
        setError('Cek nama PLN belum valid. Pastikan ID pelanggan / nomor meter benar.');
        return;
      }
    }

    if (isEmoneyCategory(category?.id)) {
      const wallet = getEmoneyProviderById(selectedEmoneyProvider);

      if (!wallet) {
        setError('Pilih jenis e-money terlebih dahulu: DANA, OVO, GoPay, ShopeePay, LinkAja, atau DOKU.');
        return;
      }

      if (!productMatchesEmoneyProvider(product, wallet)) {
        setError(`Produk ${getProductName(product)} tidak cocok untuk ${wallet.label}. Pilih produk ${wallet.label}.`);
        return;
      }
    }

    if (isOperatorFilteredCategory(category?.id)) {
      const operator = detectOperatorFromNumber(normalizedTarget);

      if (!operator) {
        setError('Prefix nomor belum dikenali. Cek kembali nomor tujuan sebelum memilih produk.');
        return;
      }

      if (!productMatchesOperator(product, operator)) {
        setError(`Produk ${getProductName(product)} tidak cocok untuk nomor ${operator.label}. Pilih produk ${operator.label}.`);
        return;
      }
    }

    setError('');
    setSelectedProduct({
      ...product,
      targetNumber: normalizedTarget,
      categoryId: category?.id,
      detectedOperator: detectedOperator?.label || '',
      selectedEmoneyProvider: selectedEmoneyProviderInfo?.label || '',
      plnInquiry: isTokenPlnCategory(category?.id) ? plnInquiry : null
    });
    setView('checkout');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => setView('home')}
          className="bg-white border-[3px] border-black p-2 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all"
        >
          ⬅️ Kembali
        </button>
        <h2 className={`text-2xl md:text-4xl font-black uppercase ${category?.color || 'bg-white'} border-[3px] border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000]`}>
          {category?.icon || '🛒'} {category?.name || 'Produk'}
        </h2>
      </div>

      <BrutalCard color="bg-[#FFDE59]">
        <h3 className="font-black text-xl mb-4 uppercase">Masukkan Nomor Tujuan</h3>
        <BrutalInput
          placeholder={category?.id === 'game' ? 'Contoh: 12345678 (1234)' : 'Contoh: 081234567890'}
          value={targetNumber}
          onChange={(e) => { setTargetNumber(e.target.value); setError(''); }}
        />
        {!targetNumber.trim() ? (
          <p className="mt-2 text-black font-bold bg-white border-2 border-black inline-block px-2 py-1">
            ⚠️ Harap isi nomor tujuan terlebih dahulu!
          </p>
        ) : null}

        {isTokenPlnCategory(category?.id) ? (
          <div className="mt-4 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0px_0px_#000]">
            <p className="font-black uppercase mb-2">Cek Nama PLN Otomatis</p>

            {!normalizePlnCustomerNo(targetNumber) ? (
              <p className="text-black font-bold bg-[#FFDE59] border-2 border-black inline-block px-3 py-2">
                ⚠️ Isi ID pelanggan / nomor meter PLN terlebih dahulu.
              </p>
            ) : plnInquiryLoading ? (
              <p className="text-black font-black bg-[#00FFFF] border-2 border-black inline-block px-3 py-2">
                🔎 Mengecek ID PLN...
              </p>
            ) : plnInquiry?.valid ? (
              <div className="space-y-2">
                <p className="text-black font-black bg-[#00FF00] border-2 border-black inline-block px-3 py-2">
                  ✅ PLN valid: {plnInquiry.customerName || plnInquiry.name || plnInquiry.customerNameMasked || 'Nama tersedia'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-bold">
                  <div className="bg-[#FFFDF0] border-2 border-black p-2">
                    ID/Meter: {plnInquiry.customerNoMasked || plnInquiry.meterNoMasked || '-'}
                  </div>
                  <div className="bg-[#FFFDF0] border-2 border-black p-2">
                    Daya: {plnInquiry.segmentPower || '-'}
                  </div>
                </div>
              </div>
            ) : plnInquiryError ? (
              <p className="text-white font-black bg-[#FF5757] border-2 border-black inline-block px-3 py-2">
                ⚠️ {plnInquiryError}
              </p>
            ) : (
              <p className="text-black font-bold bg-[#FFDE59] border-2 border-black inline-block px-3 py-2">
                Ketik minimal 6 digit untuk cek nama PLN.
              </p>
            )}
          </div>
        ) : null}

        {isEmoneyCategory(category?.id) ? (
          <div className="mt-4 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0px_0px_#000]">
            <p className="font-black uppercase mb-3">Pilih Jenis E-Money</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {EMONEY_PROVIDERS.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => { setSelectedEmoneyProvider(wallet.id); setError(''); }}
                  className={`${selectedEmoneyProvider === wallet.id ? 'bg-[#00FF00]' : 'bg-[#FFFDF0]'} border-2 border-black px-3 py-2 font-black shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 transition-all`}
                >
                  {wallet.label}
                </button>
              ))}
            </div>
            {selectedEmoneyProviderInfo ? (
              <p className="mt-3 text-black font-black bg-[#00FF00] border-2 border-black inline-block px-3 py-2">
                ✅ Wallet dipilih: {selectedEmoneyProviderInfo.label}. Produk otomatis difilter khusus {selectedEmoneyProviderInfo.label}.
              </p>
            ) : (
              <p className="mt-3 text-black font-black bg-[#FFDE59] border-2 border-black inline-block px-3 py-2">
                ⚠️ Pilih DANA, OVO, GoPay, ShopeePay, LinkAja, atau DOKU agar produk tidak campur.
              </p>
            )}
          </div>
        ) : null}

        {targetNumber.trim() && isOperatorFilteredCategory(category?.id) ? (
          detectedOperator ? (
            <p className="mt-3 text-black font-black bg-[#00FF00] border-2 border-black inline-block px-3 py-2">
              ✅ Nomor terdeteksi {detectedOperator.label}. Produk otomatis difilter khusus {detectedOperator.label}.
            </p>
          ) : (
            <p className="mt-3 text-black font-black bg-[#FF5757] border-2 border-black inline-block px-3 py-2">
              ⚠️ Prefix nomor belum dikenali. Produk belum difilter operator.
            </p>
          )
        ) : null}
      </BrutalCard>

      {error ? (
        <div className="bg-[#FF5757] text-white border-[3px] border-black p-4 font-black shadow-[4px_4px_0px_0px_#000]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="md:col-span-2 text-center p-8 bg-white border-[3px] border-black font-black text-xl shadow-[4px_4px_0px_0px_#000]">
            Memuat produk dari API...
          </div>
        ) : null}

        {!loading && visibleProducts.length > 0 ? visibleProducts.map((product) => (
          <div
            key={getProductId(product) || getProductName(product)}
            onClick={() => targetNumber.trim() && handleProductSelect(product)}
            className={`bg-white border-[3px] border-black p-4 flex justify-between items-center gap-4
              ${targetNumber.trim()
                ? 'cursor-pointer hover:-translate-y-1 shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                : 'opacity-60 grayscale cursor-not-allowed'} transition-all duration-200`}
          >
            <div>
              <h4 className="font-black text-lg">{getProductName(product)}</h4>
              <p className="font-bold text-sm bg-gray-200 inline-block px-2 border-2 border-black mt-1">
                {getProductProvider(product, category?.name)}
              </p>
            </div>
            <div className="text-xl font-black bg-[#00FF00] border-[3px] border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000] transform rotate-1 whitespace-nowrap">
              {money(getProductPrice(product))}
            </div>
          </div>
        )) : null}

        {!loading && products.length > 0 && !visibleProducts.length ? (
          <div className="md:col-span-2 text-center p-8 bg-[#FFDE59] border-[3px] border-black font-black text-xl shadow-[4px_4px_0px_0px_#000]">
            Tidak ada produk {activeFilterLabel} di kategori {category?.name || 'ini'}. Cek pilihan filter atau pilih kategori yang sesuai.
          </div>
        ) : null}

        {!loading && !products.length ? (
          <div className="md:col-span-2 text-center p-8 bg-white border-[3px] border-black font-black text-xl shadow-[4px_4px_0px_0px_#000]">
            Belum ada produk di kategori ini.
          </div>
        ) : null}
      </div>
    </div>
  );
};

const CheckoutView = ({ product, paymentMethods, setView }) => {
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!paymentMethod && paymentMethods.length) setPaymentMethod(paymentMethods[0]);
  }, [paymentMethods, paymentMethod]);

  if (!product) return null;

  const total = getProductPrice(product) + (paymentMethod?.adminFee || 0);

  const openCheckoutConfirm = () => {
    if (!paymentMethod || isProcessing) return;
    setError('');
    setConfirmOpen(true);
  };

  const handlePay = async () => {
    if (!paymentMethod) {
      setError('Pilih metode pembayaran terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      const payload = await apiPost('/api/store/orders', {
        productId: getProductId(product),
        variantId: getProductSku(product),
        customerNo: product.targetNumber,
        paymentMethod: paymentMethod.id
      });

      const invoice = extractInvoice(payload);

      if (!invoice) throw new Error('Invoice dibuat, tetapi nomor invoice tidak terbaca.');

      window.location.href = `/invoice/${encodeURIComponent(invoice)}`;
    } catch (err) {
      setError(err?.message || 'Gagal membuat invoice.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {confirmOpen ? (
        <div className="fixed inset-0 z-[999] bg-black/70 px-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-[#FFFDF0] border-[4px] border-black p-5 shadow-[10px_10px_0px_0px_#000]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-2xl font-black uppercase">Konfirmasi Pesanan</h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isProcessing}
                className="bg-white border-2 border-black px-3 py-1 font-black shadow-[2px_2px_0px_0px_#000]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm md:text-base">
              <div className="bg-white border-2 border-black p-3">
                <p className="font-bold uppercase text-gray-700">Produk</p>
                <p className="font-black text-lg">{getProductName(product)}</p>
              </div>

              <div className="bg-white border-2 border-black p-3">
                <p className="font-bold uppercase text-gray-700">Nomor Tujuan</p>
                <p className="font-black text-lg">{product?.targetNumber || '-'}</p>
              </div>

              {product?.detectedOperator ? (
                <div className="bg-[#00FF00] border-2 border-black p-3">
                  <p className="font-bold uppercase">Operator</p>
                  <p className="font-black text-lg">{product.detectedOperator}</p>
                </div>
              ) : null}

              {product?.selectedEmoneyProvider ? (
                <div className="bg-[#00FF00] border-2 border-black p-3">
                  <p className="font-bold uppercase">Wallet</p>
                  <p className="font-black text-lg">{product.selectedEmoneyProvider}</p>
                </div>
              ) : null}

              {product?.plnInquiry ? (
                <div className="bg-[#00FF00] border-2 border-black p-3">
                  <p className="font-bold uppercase">Data PLN</p>
                  <p className="font-black">{product.plnInquiry.customerName || product.plnInquiry.name || product.plnInquiry.customerNameMasked || 'Data PLN tersedia'}</p>
                  <p className="font-bold text-sm">Daya: {product.plnInquiry.segmentPower || '-'}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-white border-2 border-black p-3">
                  <p className="font-bold uppercase text-gray-700">Harga</p>
                  <p className="font-black">{money(getProductPrice(product))}</p>
                </div>
                <div className="bg-white border-2 border-black p-3">
                  <p className="font-bold uppercase text-gray-700">Admin</p>
                  <p className="font-black">{money(paymentMethod?.adminFee || 0)}</p>
                </div>
                <div className="bg-[#FFDE59] border-2 border-black p-3">
                  <p className="font-bold uppercase">Total</p>
                  <p className="font-black">{money(total)}</p>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-3">
                <p className="font-bold uppercase text-gray-700">Metode Bayar</p>
                <p className="font-black">{paymentMethod?.name || paymentMethod?.id || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isProcessing}
                className="bg-white text-black font-black uppercase border-[3px] border-black py-3 px-4 shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  handlePay();
                }}
                disabled={isProcessing || !paymentMethod}
                className="bg-[#00FF00] text-black font-black uppercase border-[3px] border-black py-3 px-4 shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Buat Invoice'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView('product')}
          className="bg-white border-[3px] border-black p-2 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all"
        >
          ⬅️ Kembali
        </button>
        <h2 className="text-3xl font-black uppercase bg-white border-[3px] border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000]">
          💳 Checkout
        </h2>
      </div>

      {error ? (
        <div className="bg-[#FF5757] text-white border-[3px] border-black p-4 font-black shadow-[4px_4px_0px_0px_#000]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BrutalCard color="bg-[#00FFFF]">
          <h3 className="font-black text-2xl mb-4 border-b-[3px] border-black pb-2">Ringkasan Pesanan</h3>
          <div className="space-y-4 text-lg">
            <div>
              <p className="font-bold text-sm uppercase">Nomor Tujuan / ID</p>
              <p className="font-black text-xl bg-white border-2 border-black p-2 mt-1">{product.targetNumber}</p>
            </div>

            {product.plnInquiry ? (
              <div>
                <p className="text-sm font-bold uppercase text-gray-700">Data PLN</p>
                <div className="font-black bg-[#00FF00] border-2 border-black p-2 mt-1 space-y-1">
                  <p>{product.plnInquiry.customerName || product.plnInquiry.name || product.plnInquiry.customerNameMasked || 'Nama PLN tersedia'}</p>
                  <p className="text-sm">Daya: {product.plnInquiry.segmentPower || '-'}</p>
                </div>
              </div>
            ) : null}
            <div>
              <p className="font-bold text-sm uppercase">Produk</p>
              <p className="font-black text-xl bg-white border-2 border-black p-2 mt-1">{getProductName(product)}</p>
            </div>
            <div className="flex justify-between items-center border-t-[3px] border-black pt-4">
              <span className="font-black text-lg">Harga Produk</span>
              <span className="font-black text-lg">{money(getProductPrice(product))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-lg">Biaya Admin</span>
              <span className="font-black text-lg">{money(paymentMethod?.adminFee || 0)}</span>
            </div>
            <div className="flex justify-between items-center bg-black text-white p-3 border-[3px] border-black transform rotate-1">
              <span className="font-black text-xl">TOTAL BAYAR</span>
              <span className="font-black text-2xl text-[#00FF00]">{money(total)}</span>
            </div>
          </div>
        </BrutalCard>

        <div className="space-y-4">
          <h3 className="font-black text-2xl uppercase bg-[#FF90E8] border-[3px] border-black px-4 py-2 inline-block shadow-[4px_4px_0px_0px_#000] mb-2">
            Metode Pembayaran
          </h3>
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => setPaymentMethod(method)}
              className={`${method.color} border-[3px] border-black p-4 flex justify-between items-center cursor-pointer
                transition-all duration-200
                ${paymentMethod?.id === method.id ? 'shadow-none translate-x-1 translate-y-1 border-dashed' : 'shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]'}`}
            >
              <div>
                <h4 className="font-black text-lg">{method.name}</h4>
                <p className="font-bold text-sm bg-white inline-block px-2 border-2 border-black mt-1">
                  + {money(method.adminFee || 0)}
                </p>
              </div>
              <div className={`w-6 h-6 border-[3px] border-black bg-white flex items-center justify-center ${paymentMethod?.id === method.id ? 'bg-black' : ''}`}>
                {paymentMethod?.id === method.id && <span className="text-[#00FF00] font-black text-xl leading-none">✓</span>}
              </div>
            </div>
          ))}

          <BrutalButton
            className="w-full mt-8 text-xl"
            disabled={!paymentMethod || isProcessing}
            onClick={openCheckoutConfirm}
            color={isProcessing ? 'bg-gray-400' : 'bg-[#FFDE59]'}
          >
            {isProcessing ? 'MEMBUAT INVOICE...' : 'BUAT INVOICE 🚀'}
          </BrutalButton>
        </div>
      </div>
    </div>
  );
};

const PriceListView = ({ categories, setView }) => {
  const [activeTab, setActiveTab] = useState(categories[0]?.id || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeTab && categories[0]?.id) setActiveTab(categories[0].id);
  }, [categories, activeTab]);

  useEffect(() => {
    if (!activeTab) return;

    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const next = await fetchProducts(activeTab);
        if (alive) setProducts(next);
      } catch (err) {
        if (alive) {
          setProducts([]);
          setError(err?.message || 'Gagal memuat daftar harga.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView('home')}
          className="bg-white border-[3px] border-black p-2 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all"
        >
          ⬅️ Kembali
        </button>
        <h2 className="text-3xl md:text-5xl font-black uppercase bg-[#00FF00] border-[3px] border-black px-4 py-2 shadow-[6px_6px_0px_0px_#000] transform -rotate-1">
          📋 Daftar Harga
        </h2>
      </div>

      {error ? (
        <div className="bg-[#FF5757] text-white border-[3px] border-black p-4 font-black shadow-[4px_4px_0px_0px_#000]">
          {error}
        </div>
      ) : null}

      <div className="flex overflow-x-auto gap-4 pb-4 px-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`${activeTab === cat.id ? 'bg-black text-white shadow-none translate-y-1 translate-x-1' : 'bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1'}
            border-[3px] border-black px-6 py-2 font-black uppercase whitespace-nowrap transition-all`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <BrutalCard color="bg-white" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FF90E8] border-b-[3px] border-black text-left">
                <th className="p-4 border-r-[3px] border-black font-black uppercase">Kode SKU</th>
                <th className="p-4 border-r-[3px] border-black font-black uppercase">Nama Produk</th>
                <th className="p-4 border-r-[3px] border-black font-black uppercase">Provider</th>
                <th className="p-4 font-black uppercase text-right">Harga</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center font-black text-xl">Memuat produk...</td></tr>
              ) : products.length > 0 ? (
                products.map((prod, index) => (
                  <tr key={getProductId(prod) || getProductName(prod)} className={`border-b-[3px] border-black hover:bg-gray-100 ${index % 2 !== 0 ? 'bg-[#FFFDF0]' : 'bg-white'}`}>
                    <td className="p-4 border-r-[3px] border-black font-mono font-bold text-sm">{getProductSku(prod) || getProductId(prod)}</td>
                    <td className="p-4 border-r-[3px] border-black font-bold">{getProductName(prod)}</td>
                    <td className="p-4 border-r-[3px] border-black font-bold uppercase text-xs">
                      <span className="bg-black text-white px-2 py-1">{getProductProvider(prod, activeTab)}</span>
                    </td>
                    <td className="p-4 font-black text-right text-lg">{money(getProductPrice(prod))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center font-black text-xl">
                    Data harga belum tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BrutalCard>
    </div>
  );
};



const StaticPageView = ({ type }) => {
  const content = {
    title: 'Kebijakan Privasi (Privacy Policy)',
    body: (
      <div className="space-y-4">
        <p>ERLKIM PULSA sangat menghargai privasi pengguna.</p>
        <p>1. <strong>Pengumpulan Data:</strong> Kami hanya mengumpulkan data yang diperlukan untuk memproses transaksi Anda (seperti nomor HP, ID pelanggan, dan alamat email jika diisi).</p>
        <p>2. <strong>Keamanan Data:</strong> Kami tidak pernah menyimpan nomor kartu kredit atau PIN Anda. Semua pembayaran diproses melalui jalur aman Midtrans dan QRIS.</p>
        <p>3. <strong>Penggunaan Data:</strong> Data nomor tujuan hanya diteruskan ke provider PPOB (Digiflazz) untuk keperluan injeksi pulsa/paket. Kami tidak pernah menjual data pelanggan ke pihak ketiga mana pun.</p>
        <p>4. <strong>Log Sistem:</strong> Sistem menyimpan log transaksi untuk keperluan audit dan penyelesaian masalah jika ada komplain.</p>
      </div>
    )
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="bg-[#FF90E8] border-[4px] border-black p-4 inline-block shadow-[4px_4px_0px_0px_#000]">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{content.title}</h2>
      </div>
      <BrutalCard color="bg-white">
        <div className="prose prose-lg max-w-none font-medium leading-relaxed">
          {content.body}
        </div>
      </BrutalCard>
    </div>
  );
};const App = () => {
  const initialInvoice = useMemo(() => {
    const match = window.location.pathname.match(/^\/invoice\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const [view, setView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [flashsaleProducts, setFlashsaleProducts] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadFlashsaleProducts() {
      try {
        const response = await fetch(`${API_BASE}/api/products?flashsale=true`);
        const payload = await response.json().catch(() => ({}));
        const items = normalizeArray(payload)
          .filter((item) => isFlashSaleProduct(item))
          .slice(0, 12);

        if (alive) setFlashsaleProducts(items);
      } catch (_) {
        if (alive) setFlashsaleProducts([]);
      }
    }

    loadFlashsaleProducts();

    return () => {
      alive = false;
    };
  }, []);
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT);

  useEffect(() => {
    let alive = true;
    fetchHomeContent().then((next) => {
      if (alive) setHomeContent({ ...DEFAULT_HOME_CONTENT, ...(next || {}) });
    }).catch(() => {
      if (alive) setHomeContent(DEFAULT_HOME_CONTENT);
    });
    return () => {
      alive = false;
    };
  }, []);

  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    handleMidtransReturnRedirect();
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(initialInvoice);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body {
        background-color: #FFFDF0;
        background-image: radial-gradient(#000 1px, transparent 1px);
        background-size: 20px 20px;
        font-family: 'Inter', system-ui, sans-serif;
      }
      @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        animation: marquee 20s linear infinite;
        min-width: 200%;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      ::-webkit-scrollbar-track {
        background: #FFFDF0;
        border-left: 3px solid black;
      }
      ::-webkit-scrollbar-thumb {
        background: #FF5757;
        border: 3px solid black;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #FF0000;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setLoading(true);
        setError('');

        // Check maintenance mode first
        try {
          const mRes = await fetch(`${API_BASE}/api/maintenance-status`);
          const mPayload = await mRes.json().catch(() => ({}));
          const mData = mPayload?.data || mPayload;
          if (mData?.maintenanceMode) {
            if (alive) {
              setMaintenanceData(mData);
              setLoading(false);
            }
            return;
          }
          if (alive) setMaintenanceData(null);
        } catch (_) {
          // If maintenance check fails, proceed normally
        }

        const [nextCategories, nextPayments] = await Promise.all([
          fetchCategories(),
          fetchPaymentMethods().catch(() => normalizePaymentMethods([]))
        ]);

        if (!alive) return;

        setCategories(nextCategories);
        setPaymentMethods(nextPayments);
        setSelectedCategory((current) => current || nextCategories[0]?.id || null);

        const featured = [];
        for (const cat of nextCategories.slice(0, 3)) {
          try {
            const products = await fetchProducts(cat.id);
            if (products[0]) {
              featured.push({ ...products[0], categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon });
            }
          } catch (_) {
            // ignore featured fetch failure per category
          }
        }

        if (alive) setFeaturedProducts(featured);
      } catch (err) {
        if (alive) setError(err?.message || 'Gagal memuat data API.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    boot();

    return () => {
      alive = false;
    };
  }, []);

  if (invoice) {
    return (
      <NeoInvoiceView
        invoice={invoice}
        setInvoice={setInvoice}
        setView={setView}
      />
    );
  }

  if (maintenanceData?.maintenanceMode) {
    const waNum = maintenanceData.maintenanceWhatsapp || WHATSAPP_NUMBER;
    const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent('Halo, saya ingin menanyakan kapan web PPOB kembali online.')}`;
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 20
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          background: '#fff',
          border: '4px solid #000',
          borderRadius: 18,
          boxShadow: '8px 8px 0 #000',
          padding: '48px 36px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔧</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            {maintenanceData.maintenanceTitle || 'Web Sedang Maintenance'}
          </h1>
          <p style={{ fontSize: 16, color: '#555', lineHeight: 1.6, margin: '0 0 20px' }}>
            {maintenanceData.maintenanceMessage || 'Kami sedang melakukan perawatan sistem agar layanan PPOB lebih stabil dan aman.'}
          </p>
          <div style={{
            background: '#FFFDE8',
            border: '3px solid #000',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 24
          }}>
            ⏳ {maintenanceData.maintenanceEta || 'Silakan cek kembali beberapa saat lagi.'}
          </div>
          {waNum && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#25D366',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                padding: '14px 28px',
                border: '3px solid #000',
                borderRadius: 12,
                boxShadow: '4px 4px 0 #000',
                textDecoration: 'none',
                transition: 'transform 0.15s',
                cursor: 'pointer'
              }}
            >
              💬 Hubungi Admin via WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MarqueeBanner text={homeContent.runningText || DEFAULT_HOME_CONTENT.runningText} />
      <Navbar setView={setView} brandName={homeContent.brandName || DEFAULT_HOME_CONTENT.brandName} />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {view === 'home' && (
          <HomeView
            categories={categories}
            featuredProducts={featuredProducts}
            flashsaleProducts={flashsaleProducts}
            homeContent={homeContent}
            loading={loading}
            error={error}
            setView={setView}
            setSelectedCategory={setSelectedCategory}
            setSelectedProduct={setSelectedProduct}
          />
        )}
        {view === 'product' && (
          <ProductView
            categoryId={selectedCategory}
            categories={categories}
            setView={setView}
            setSelectedProduct={setSelectedProduct}
          />
        )}
        {view === 'checkout' && (
          <CheckoutView
            product={selectedProduct}
            paymentMethods={paymentMethods}
            setView={setView}
          />
        )}
        {view === 'pricelist' && (
          <PriceListView categories={categories} setView={setView} />
        )}
        {view === 'privacy' && (
          <StaticPageView type="privacy" />
        )}
      </main>

      <footer className="bg-black text-white mt-12 border-t-[4px] border-black py-8">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-2xl font-black mb-4 flex items-center gap-2">
              <span className="bg-[#00FF00] text-black border-2 border-white px-2 py-1 transform rotate-2">ERLKIM</span>
              PULSA
            </div>
            <p className="font-bold font-mono text-sm opacity-80">
              Platform Topup & PPOB dengan integrasi API kategori, produk, payment method, dan invoice.
            </p>
          </div>
          <div>
            <h4 className="font-black text-xl mb-4 border-b-2 border-white inline-block pb-1">MENU</h4>
            <ul className="space-y-2 font-bold font-mono">
              <li><button onClick={() => setView('home')} className="hover:text-[#FFDE59]">Beranda</button></li>
              <li><button onClick={() => setView('pricelist')} className="hover:text-[#FFDE59]">Daftar Harga</button></li>
              <li><a href="/syarat-ketentuan" className="hover:text-[#FFDE59]">Syarat & Ketentuan</a></li>
              <li><button onClick={() => setView('privacy')} className="hover:text-[#FFDE59]">Privacy & Policy</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-xl mb-4 border-b-2 border-white inline-block pb-1">BANTUAN</h4>
            <div className="space-y-4">
              <BrutalButton color="bg-[#00FF00]" className="w-full text-sm">
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#FFDE59]"
                >
                  Hubungi CS WhatsApp
                </a>
              </BrutalButton>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-4 border-t-2 border-dashed border-gray-700 text-center font-bold font-mono text-xs">
          {homeContent.footerText || DEFAULT_HOME_CONTENT.footerText}
        </div>
      </footer>
    </div>
  );
};

export default App;
