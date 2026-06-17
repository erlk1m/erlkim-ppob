import { useStorefront } from '../StorefrontProvider';

export function StorefrontErrorSection() {
  const { error } = useStorefront();

  if (!error) return null;

  return (
    <section className="storefront-module storefront-module-error">
      <div className="alert">{error}</div>
    </section>
  );
}
