import { StorefrontProductSection } from './StorefrontProductSection';
import { StorefrontCheckoutSection } from './StorefrontCheckoutSection';

export function StorefrontMainLayout() {
  return (
    <section className="sf-legacy-main-layout">
      <StorefrontProductSection />
      <StorefrontCheckoutSection />
    </section>
  );
}
