import { Hero } from '../components/Hero';
import { CategoryTabs } from '../components/CategoryTabs';
import { ProductGrid } from '../components/ProductGrid';
import { CheckoutPanel } from '../components/CheckoutPanel';
import { useStorefrontCatalog } from '../hooks/useStorefrontCatalog';
import { useCheckoutOrder } from '../hooks/useCheckoutOrder';

export function HomePage() {
  const catalog = useStorefrontCatalog();
  const checkout = useCheckoutOrder(catalog.selectedPayment);

  const error = catalog.catalogError || checkout.checkoutError;

  function handleCategoryChange(slug: string) {
    catalog.changeCategory(slug);
    checkout.resetSelection();
  }

  return (
    <main>
      <Hero />

      <CategoryTabs
        categories={catalog.categories}
        active={catalog.activeCategory}
        onChange={handleCategoryChange}
      />

      {error ? <div className="alert">{error}</div> : null}

      <section className="layout">
        <ProductGrid
          category={catalog.activeCategory}
          products={catalog.products}
          selectedProduct={checkout.selectedProduct}
          loading={catalog.loadingProducts}
          onSelect={checkout.setSelectedProduct}
        />

        <CheckoutPanel
          selectedProduct={checkout.selectedProduct}
          customerNo={checkout.customerNo}
          creating={checkout.creating}
          onCustomerNoChange={checkout.setCustomerNo}
          onCheckout={checkout.checkout}
        />
      </section>
    </main>
  );
}
