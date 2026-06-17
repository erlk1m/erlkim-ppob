import { StorefrontHeroSection } from './sections/StorefrontHeroSection';
import { StorefrontCategorySection } from './sections/StorefrontCategorySection';
import { StorefrontErrorSection } from './sections/StorefrontErrorSection';
import { StorefrontProductSection } from './sections/StorefrontProductSection';
import { StorefrontCheckoutSection } from './sections/StorefrontCheckoutSection';

export function StorefrontBody() {
  return (
    <main className="sf-app">
      <section className="sf-app-grid">
        <div className="sf-app-main">
          <StorefrontHeroSection />
          <StorefrontCategorySection />
          <StorefrontErrorSection />
          <StorefrontProductSection />
        </div>

        <aside className="sf-app-sidebar">
          <StorefrontCheckoutSection />

          <section className="sf-guide-card">
            <p className="sf-section-kicker">Alur transaksi</p>
            <ol>
              <li>Pilih kategori layanan.</li>
              <li>Pilih produk yang ingin dibeli.</li>
              <li>Masukkan nomor tujuan atau ID pelanggan.</li>
              <li>Buat invoice lalu selesaikan pembayaran.</li>
            </ol>
          </section>
        </aside>
      </section>
    </main>
  );
}
