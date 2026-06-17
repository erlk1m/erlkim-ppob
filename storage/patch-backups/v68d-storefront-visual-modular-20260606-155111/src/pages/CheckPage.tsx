import { useState } from 'react';

export function CheckPage() {
  const [value, setValue] = useState('');

  return (
    <main className="invoicePage">
      <section className="panel invoicePanel">
        <p className="eyebrow">Cek Invoice</p>
        <h1>Cari status transaksi</h1>

        <label>
          Nomor invoice
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="INV..." />
        </label>

        <button
          className="primaryBtn"
          type="button"
          onClick={() => {
            if (value.trim()) location.href = `/invoice/${encodeURIComponent(value.trim())}`;
          }}
        >
          Cek Sekarang
        </button>
      </section>
    </main>
  );
}
