import { StorefrontHeroSection } from './sections/StorefrontHeroSection';
import { StorefrontCategorySection } from './sections/StorefrontCategorySection';
import { StorefrontErrorSection } from './sections/StorefrontErrorSection';
import { StorefrontMainLayout } from './sections/StorefrontMainLayout';

export function StorefrontBody() {
  return (
    <main>
      <StorefrontHeroSection />
      <StorefrontCategorySection />
      <StorefrontErrorSection />
      <StorefrontMainLayout />
    </main>
  );
}
