import { StorefrontProductSection } from './StorefrontProductSection';
import { StorefrontCheckoutSection } from './StorefrontCheckoutSection';

export function StorefrontMainLayout() {
  return (
    <section className="layout">
      <StorefrontProductSection />
      <StorefrontCheckoutSection />
    </section>
  );
}
