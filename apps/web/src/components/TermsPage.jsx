import React, { useState } from 'react';

const termsData = [
  {
    id: '01',
    title: 'KETENTUAN UMUM',
    icon: '▣',
    color: 'bg-pink-400',
    items: [
      <>Dengan menggunakan layanan <strong>ERLKIMPULSA</strong>, Anda secara otomatis menyetujui semua syarat dan ketentuan yang berlaku.</>,
      <>Layanan ini beroperasi mengandalkan sistem pihak ketiga, termasuk Digiflazz dan provider telekomunikasi.</>,
      <>Kami berhak mengubah syarat dan ketentuan sewaktu-waktu tanpa pemberitahuan prioritas kepada pengguna.</>
    ]
  },
  {
    id: '02',
    title: 'TRANSAKSI & PEMBAYARAN',
    icon: '⚡',
    color: 'bg-yellow-400',
    items: [
      <>Harga produk dapat berubah sewaktu-waktu mengikuti kebijakan provider dan server pusat.</>,
      <>Kesalahan penulisan <strong>Nomor Tujuan</strong> atau <strong>ID Pelanggan</strong> sepenuhnya merupakan tanggung jawab pembeli. Kami tidak menerima permintaan refund untuk kasus ini.</>,
      <>Pembayaran menggunakan QRIS wajib sesuai dengan nominal yang tertera hingga ke digit terakhir jika ada kode unik.</>
    ]
  },
  {
    id: '03',
    title: 'GANGGUAN & PENDING',
    icon: '⚠',
    color: 'bg-cyan-400',
    items: [
      <>Jika status transaksi <strong>"Pending"</strong>, harap bersabar. Hal ini biasanya disebabkan oleh antrean di server pusat atau gangguan dari provider.</>,
      <>Transaksi yang sudah masuk ke sistem tidak dapat dibatalkan secara sepihak oleh pembeli kecuali status telah dinyatakan Gagal oleh server pusat.</>
    ]
  },
  {
    id: '04',
    title: 'KEBIJAKAN REFUND',
    icon: '🛡',
    color: 'bg-green-400',
    items: [
      <>Pengembalian dana atau refund <strong>HANYA</strong> dilakukan jika status transaksi dipastikan <strong>"GAGAL"</strong> oleh sistem/server.</>,
      <>Saldo akan dikembalikan utuh ke saldo akun Anda, atau diproses transfer manual sesuai kesepakatan dengan potongan biaya admin bank jika berbeda bank.</>,
      <>Klaim transaksi tidak masuk padahal status "Sukses" dan memiliki SN/Serial Number wajib melampirkan mutasi atau bukti cek kuota dari provider terkait maksimal 1x24 jam.</>
    ]
  }
];

export default function TermsPage() {
  const [hasAgreed, setHasAgreed] = useState(false);

  function goHome() {
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-purple-200 font-mono text-black pb-32 selection:bg-black selection:text-yellow-400">
      <div className="w-full bg-yellow-400 border-b-4 border-black py-4 overflow-hidden relative">
        <div className="whitespace-nowrap flex items-center gap-4 text-xl font-black uppercase tracking-widest terms-marquee">
          <span>⚠️ PERHATIAN: BACA SEBELUM TRANSAKSI</span>
          <span className="text-pink-600">✦</span>
          <span>⚠️ PERHATIAN: BACA SEBELUM TRANSAKSI</span>
          <span className="text-pink-600">✦</span>
          <span>⚠️ PERHATIAN: BACA SEBELUM TRANSAKSI</span>
          <span className="text-pink-600">✦</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8 md:mt-12">
        <button
          type="button"
          onClick={goHome}
          className="mb-6 bg-white border-[3px] border-black px-4 py-2 font-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          ← Kembali ke Store
        </button>

        <div className="relative mb-16">
          <div className="absolute top-4 left-4 w-full h-full bg-black z-0" />
          <div className="relative z-10 bg-white border-4 border-black p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
                Syarat & <br />
                <span className="text-pink-500 underline decoration-8 decoration-cyan-400">
                  Ketentuan
                </span>
              </h1>
              <p className="font-bold text-gray-600 flex items-center gap-2">
                <span>▰</span> Last Updated: Juni 2026
              </p>
            </div>

            <div className="bg-black text-white p-4 font-bold transform rotate-3 shadow-[-8px_8px_0px_0px_rgba(236,72,153,1)]">
              ERLKIMPULSA v2.0
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {termsData.map((term) => (
            <div key={term.id} className="relative group">
              <div className="absolute top-3 left-3 w-full h-full bg-black z-0 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />

              <div className="relative z-10 bg-white border-4 border-black flex flex-col md:flex-row">
                <div className={`${term.color} border-b-4 md:border-b-0 md:border-r-4 border-black p-6 flex flex-row md:flex-col items-center justify-center gap-2 md:w-32 shrink-0`}>
                  <span className="text-4xl font-black bg-white border-2 border-black px-2 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {term.id}
                  </span>
                  <div className="hidden md:block mt-4 bg-black text-white p-2 rounded-full text-2xl">
                    {term.icon}
                  </div>
                </div>

                <div className="p-6 md:p-8 flex-1">
                  <h2 className="text-2xl font-black uppercase mb-4 flex items-center gap-3">
                    <span className="md:hidden bg-black text-white p-1">{term.icon}</span>
                    {term.title}
                  </h2>

                  <ul className="list-disc pl-5 space-y-2 font-medium text-base md:text-lg">
                    {term.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t-4 border-black p-4 z-50 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0px_-8px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3 font-bold text-base md:text-lg">
          <button
            type="button"
            onClick={() => setHasAgreed(!hasAgreed)}
            className={`w-8 h-8 border-4 border-black flex items-center justify-center transition-colors ${hasAgreed ? 'bg-green-400' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {hasAgreed ? '✓' : ''}
          </button>

          <button
            type="button"
            className="cursor-pointer select-none text-left"
            onClick={() => setHasAgreed(!hasAgreed)}
          >
            Saya telah membaca dan menyetujui semua syarat.
          </button>
        </div>

        <button
          type="button"
          onClick={goHome}
          className={`px-8 py-3 font-black text-xl border-4 border-black flex items-center gap-2 transition-all ${
            hasAgreed
              ? 'bg-cyan-400 hover:bg-cyan-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-black cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
          }`}
          disabled={!hasAgreed}
        >
          LANJUT TRANSAKSI →
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes termsMarquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .terms-marquee {
            animation: termsMarquee 20s linear infinite;
          }
        `
      }} />
    </div>
  );
}
