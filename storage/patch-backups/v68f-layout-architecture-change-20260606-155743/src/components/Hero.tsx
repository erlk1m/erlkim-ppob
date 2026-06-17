export function Hero() {
  return (
    <section className="sf-hero">
      <div className="sf-hero__content">
        <p className="sf-eyebrow">ERLKIM PPOB STORE</p>
        <h1>Top up digital cepat, rapi, dan siap transaksi.</h1>
        <p>
          Pilih kategori, pilih produk, masukkan nomor tujuan, lalu buat invoice pembayaran.
          Tampilan store sekarang dipisah menjadi modul yang lebih jelas.
        </p>

        <div className="sf-hero__actions">
          <a href="#produk" className="sf-hero__button">
            Lihat Produk
          </a>
          <a href="#checkout" className="sf-hero__link">
            Ke Checkout
          </a>
        </div>
      </div>

      <div className="sf-hero__status">
        <span className="sf-status-card">
          <strong>Mode</strong>
          <small>Halloween / Hujan Petir</small>
        </span>
        <span className="sf-status-card">
          <strong>Produk</strong>
          <small>Digiflazz Catalog</small>
        </span>
        <span className="sf-status-card">
          <strong>Pembayaran</strong>
          <small>Manual QRIS / Midtrans</small>
        </span>
      </div>
    </section>
  );
}
