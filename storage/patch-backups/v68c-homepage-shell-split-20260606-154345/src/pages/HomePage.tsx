import { Hero, CategoryTabs, ProductGrid, CheckoutPanel } from '../components';
import { useStorefrontCatalog, useCheckoutOrder } from '../hooks';

import { StorefrontPage } from '../features/storefront/StorefrontPage';

export function HomePage() {
  return <StorefrontPage />;
}
