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
    <div className="panel productsPanel">
      <div className="sectionHead">
        <h2>Produk</h2>
        <span>{loading ? 'Memuat...' : `${products.length} item`}</span>
      </div>

      <div className="productGrid">
        {products.map((product) => {
          const id = getProductId(product);
          const active = selectedProduct && getProductId(selectedProduct) === id;

          return (
            <button
              type="button"
              key={id || getProductName(product)}
              className={`productCard ${active ? 'active' : ''}`}
              onClick={() => onSelect(product)}
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
  );
}
