import type { Product } from '../types';
import { getProductId, getProductName, getProductPrice, money } from '../lib/format';

type Props = {
  category: string;
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  onSelect: (product: Product) => void;
};

export function ProductGrid({ category, products, selectedProduct, loading, onSelect }: Props) {
  return (
    <section id="produk" className="sf-section sf-products-section">
      <div className="sf-section-head">
        <div>
          <p className="sf-section-kicker">Daftar produk</p>
          <h2>Produk tersedia</h2>
        </div>
        <span>{loading ? 'Memuat...' : `${products.length} item`}</span>
      </div>

      <div className="sf-product-grid">
        {products.map((product) => {
          const id = getProductId(product);
          const active = selectedProduct && getProductId(selectedProduct) === id;

          return (
            <button
              type="button"
              key={id || getProductName(product)}
              className={`sf-product-card ${active ? 'is-active' : ''}`}
              onClick={() => onSelect(product)}
            >
              <span className="sf-product-card__brand">{product.brand || category}</span>
              <strong>{getProductName(product)}</strong>
              <span className="sf-product-card__price">{money(getProductPrice(product))}</span>
              <span className="sf-product-card__cta">
                {active ? 'Dipilih' : 'Pilih produk'}
              </span>
            </button>
          );
        })}
      </div>

      {!loading && !products.length ? (
        <div className="sf-empty-state">Produk belum tersedia untuk kategori ini.</div>
      ) : null}
    </section>
  );
}
