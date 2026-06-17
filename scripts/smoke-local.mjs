const API = process.env.API_URL || 'http://localhost:3001/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me-admin-token';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok === false) throw new Error(`${path}: ${json.message || response.statusText}`);
  return json.data;
}

function log(name, data) {
  console.log(`✓ ${name}`, data ? JSON.stringify(data).slice(0, 160) : '');
}

const health = await request('/health');
log('health', health);
const settings = await request('/settings/public');
log('settings public', { brand: settings.site.brandName, payments: settings.paymentMethods.length });
const products = await request('/products?type=prepaid&sort=price_asc');
log('products', { total: products.length });
if (!products.length) throw new Error('Tidak ada produk prepaid');
const orderResult = await request('/store/orders', { method: 'POST', body: JSON.stringify({ productId: products[0].id, customerNo: '081234567890', paymentMethodId: 'manual-qris' }) });
log('checkout prepaid', { invoice: orderResult.order.invoice });
const approved = await request(`/admin/orders/${orderResult.order.invoice}/approve-payment`, { method: 'POST', headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }, body: JSON.stringify({ testing: true }) });
log('approve prepaid', { invoice: approved.invoice, orderStatus: approved.orderStatus, sn: approved.sn });
const inquiry = await request('/store/bills/inquiry', { method: 'POST', body: JSON.stringify({ buyerSkuCode: 'pln', customerNo: '530000000001', testing: true }) });
log('postpaid inquiry', { refId: inquiry.refId, customerName: inquiry.customerName });
const billOrder = await request('/store/bills/order', { method: 'POST', body: JSON.stringify({ refId: inquiry.refId, paymentMethodId: 'manual-qris' }) });
log('postpaid order', { invoice: billOrder.order.invoice });
const logs = await request('/admin/logs/provider', { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
log('provider logs', { total: logs.length });
console.log('Smoke local selesai.');
