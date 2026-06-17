import { StorefrontProductSection } from './StorefrontProductSection';
import { StorefrontCheckoutSection } from './StorefrontCheckoutSection';

export function StorefrontMainLayout() {
  return (
    <section className="storefront-main-grid">
      <StorefrontProductSection />
      <StorefrontCheckoutSection />
    </section>
  );
}
