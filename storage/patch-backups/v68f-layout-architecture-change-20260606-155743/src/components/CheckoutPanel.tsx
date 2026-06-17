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
    <section id="checkout" className="sf-section sf-checkout-section">
      <div className="sf-section-head sf-checkout-head">
        <div>
          <p className="sf-section-kicker">Checkout</p>
          <h2>Buat invoice</h2>
        </div>
      </div>

      <div className="sf-checkout-box">
        <label className="sf-field">
          <span>Produk dipilih</span>
          <div className="sf-selected-product">
            {selectedProduct ? (
              <>
                <strong>{getProductName(selectedProduct)}</strong>
                <small>{money(getProductPrice(selectedProduct))}</small>
              </>
            ) : (
              <>
                <strong>Belum ada produk</strong>
                <small>Pilih salah satu produk dari daftar.</small>
              </>
            )}
          </div>
        </label>

        <label className="sf-field">
          <span>Nomor tujuan / ID pelanggan</span>
          <input
            value={customerNo}
            onChange={(e) => onCustomerNoChange(e.target.value)}
            placeholder="Contoh: 081234567890"
          />
        </label>

        <button className="sf-primary-button" type="button" disabled={creating} onClick={onCheckout}>
          {creating ? 'Membuat invoice...' : 'Buat Invoice'}
        </button>

        <div className="sf-checkout-note">
          Pastikan nomor tujuan benar sebelum membuat invoice.
        </div>
      </div>
    </section>
  );
}
