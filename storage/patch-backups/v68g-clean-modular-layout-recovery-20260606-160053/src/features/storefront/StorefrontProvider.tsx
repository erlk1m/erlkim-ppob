import { createContext, useContext, type ReactNode } from 'react';
import { useStorefrontCatalog } from '../../hooks/useStorefrontCatalog';
import { useCheckoutOrder } from '../../hooks/useCheckoutOrder';

type StorefrontContextValue = {
  catalog: ReturnType<typeof useStorefrontCatalog>;
  checkout: ReturnType<typeof useCheckoutOrder>;
  error: string;
  changeCategoryAndResetCheckout: (slug: string) => void;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const catalog = useStorefrontCatalog();
  const checkout = useCheckoutOrder(catalog.selectedPayment);

  const error = catalog.catalogError || checkout.checkoutError;

  function changeCategoryAndResetCheckout(slug: string) {
    catalog.changeCategory(slug);
    checkout.resetSelection();
  }

  return (
    <StorefrontContext.Provider
      value={{
        catalog,
        checkout,
        error,
        changeCategoryAndResetCheckout
      }}
    >
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const value = useContext(StorefrontContext);

  if (!value) {
    throw new Error('useStorefront must be used inside StorefrontProvider');
  }

  return value;
}
