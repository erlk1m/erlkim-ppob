import { ProductGrid } from '../../../components/ProductGrid';
import { useStorefront } from '../StorefrontProvider';

export function StorefrontProductSection() {
  const { catalog, checkout } = useStorefront();

  return (
    <section className="storefront-module storefront-module-products">
      <ProductGrid
        category={catalog.activeCategory}
        products={catalog.products}
        selectedProduct={checkout.selectedProduct}
        loading={catalog.loadingProducts}
        onSelect={checkout.setSelectedProduct}
      />
    </section>
  );
}
