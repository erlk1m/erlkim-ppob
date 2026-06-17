import { useStorefront } from '../StorefrontProvider';

export function StorefrontErrorSection() {
  const { error } = useStorefront();

  if (!error) return null;

  return <div className="alert">{error}</div>;
}
