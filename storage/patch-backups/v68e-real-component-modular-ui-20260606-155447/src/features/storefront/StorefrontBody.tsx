import { StorefrontHeroSection } from './sections/StorefrontHeroSection';
import { StorefrontCategorySection } from './sections/StorefrontCategorySection';
import { StorefrontErrorSection } from './sections/StorefrontErrorSection';
import { StorefrontMainLayout } from './sections/StorefrontMainLayout';

export function StorefrontBody() {
  return (
    <main className="storefront-page">
      <div className="storefront-module storefront-module-hero">
        <StorefrontHeroSection />
      </div>

      <div className="storefront-module storefront-module-categories">
        <StorefrontCategorySection />
      </div>

      <StorefrontErrorSection />

      <StorefrontMainLayout />
    </main>
  );
}
