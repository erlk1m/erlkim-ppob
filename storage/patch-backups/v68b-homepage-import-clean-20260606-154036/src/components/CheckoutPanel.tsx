import type { Product } from '../types';
import { getProductName, getProductPrice, money } from '../lib/format';

type Props = {
  selectedProduct: Product | null;
  customerNo: string;
  creating: boolean;
  onCustomerNoChange: (value: string) => void;
  onCheckout: () => void;
};

export function CheckoutPanel({
  selectedProduct,
  customerNo,
  creating,
  onCustomerNoChange,
  onCheckout
}: Props) {
  return (
    <aside className="panel checkoutPanel">
      <h2>Checkout</h2>

      <label>
        Produk
        <div className="selectedBox">
          {selectedProduct ? (
            <>
              <strong>{getProductName(selectedProduct)}</strong>
              <span>{money(getProductPrice(selectedProduct))}</span>
            </>
          ) : (
            <span>Pilih produk dulu</span>
          )}
        </div>
      </label>

      <label>
        Nomor tujuan / ID pelanggan
        <input
          value={customerNo}
          onChange={(e) => onCustomerNoChange(e.target.value)}
          placeholder="Contoh: 081234567890"
        />
      </label>

      <button className="primaryBtn" type="button" disabled={creating} onClick={onCheckout}>
        {creating ? 'Membuat invoice...' : 'Buat Invoice'}
      </button>
    </aside>
  );
}
