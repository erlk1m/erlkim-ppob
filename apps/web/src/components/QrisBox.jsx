import { useEffect, useState } from 'react';

export function QrisBox({ imageUrl, payload, name, merchantName }) {
  const [dataUrl, setDataUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function makeQr() {
      setFailed(false);

      if (imageUrl) {
        setDataUrl('');
        return;
      }

      if (!payload) {
        setDataUrl('');
        return;
      }

      try {
        const mod = await import('qrcode');
        const toDataURL = mod.toDataURL || mod.default?.toDataURL;

        if (!toDataURL) throw new Error('qrcode_toDataURL_missing');

        const url = await toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320
        });

        if (alive) setDataUrl(url);
      } catch {
        if (alive) {
          setDataUrl('');
          setFailed(true);
        }
      }
    }

    makeQr();

    return () => {
      alive = false;
    };
  }, [imageUrl, payload]);

  if (!imageUrl && !payload) return null;

  return (
    <div className="qrisCleanBox">
      <div className="qrisCleanTitle">
        <strong>{name || 'QRIS'}</strong>
        {merchantName ? <small>{merchantName}</small> : null}
      </div>

      {imageUrl || dataUrl ? (
        <img src={imageUrl || dataUrl} alt="QRIS pembayaran" className="qrisCleanImage" />
      ) : (
        <div className="qrisFallback">QRIS tersedia, tetapi gambar QR belum berhasil dibuat.</div>
      )}

      {failed ? <small className="qrisError">Gambar QR gagal dibuat. Silakan refresh halaman.</small> : null}
    </div>
  );
}

export default QrisBox;
