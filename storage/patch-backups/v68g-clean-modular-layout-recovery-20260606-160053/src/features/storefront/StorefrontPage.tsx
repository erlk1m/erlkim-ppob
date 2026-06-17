import './storefront-modular.css';

import { StorefrontProvider } from './StorefrontProvider';
import { StorefrontBody } from './StorefrontBody';

export function StorefrontPage() {
  return (
    <StorefrontProvider>
      <StorefrontBody />
    </StorefrontProvider>
  );
}
