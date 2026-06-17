# Optional local Nginx

Untuk Cloudflare Tunnel, Nginx tidak wajib. Cloudflared boleh langsung mengarah ke Node/PM2 ports:

- API: 127.0.0.1:3001
- Store: 127.0.0.1:3000
- Admin: 127.0.0.1:3333

Pakai Nginx lokal hanya kalau ingin reverse proxy tambahan, static file cache, atau header khusus sebelum cloudflared.
