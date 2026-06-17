import { CheckoutPanel } from '../../../components/CheckoutPanel';
import { useStorefront } from '../StorefrontProvider';

export function StorefrontCheckoutSection() {
  const { checkout } = useStorefront();

  return (
    <aside className="storefront-module storefront-module-checkout">
      <CheckoutPanel
        selectedProduct={checkout.selectedProduct}
        customerNo={checkout.customerNo}
        creating={checkout.creating}
        onCustomerNoChange={checkout.setCustomerNo}
        onCheckout={checkout.checkout}
      />
    </aside>
  );
}
