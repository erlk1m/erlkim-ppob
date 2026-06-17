import { StorefrontProvider } from './StorefrontProvider';
import { StorefrontBody } from './StorefrontBody';

export function StorefrontPage() {
  return (
    <StorefrontProvider>
      <StorefrontBody />
    </StorefrontProvider>
  );
}
