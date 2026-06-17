# PPOB Digiflazz (Rust + React Monorepo)

Aplikasi PPOB (Payment Point Online Bank) berkecepatan tinggi yang dibangun menggunakan **Rust** (Backend) dan **React/Vite** (Frontend). Terintegrasi dengan **Digiflazz** (untuk pemrosesan produk digital otomatis) dan **Midtrans** (untuk gerbang pembayaran/Payment Gateway).

## 🚀 Fitur Utama
- **⚡ Super Cepat:** Backend ditulis dalam bahasa Rust (Axum + SQLx) memastikan latensi sangat rendah dan hemat memori.
- **🎨 UI Modern:** Frontend (Toko Publik & Panel Admin) menggunakan React + TypeScript + Vite.
- **🔄 Otomatisasi Penuh:** Transaksi diproses secara *real-time* via *Webhook* Digiflazz dan Midtrans.
- **🛡️ Keamanan Ketat:** Validasi HMAC SHA-1 (Digiflazz) & SHA-512 (Midtrans) untuk menghindari transaksi palsu. Middleware *AdminAuth* untuk proteksi endpoint internal.

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum melakukan instalasi, pastikan sistem Anda sudah terpasang:
- **Node.js** (v18+) & **PNPM** (Package Manager)
- **Rust** (`cargo`, `rustc` versi 1.75+)
- **PostgreSQL** (Database)

## 📦 Instalasi & Menjalankan di Lokal (Development)

### 1. Kloning & Persiapan Repositori
```bash
git clone https://github.com/erlk1m/erlkim-ppob.git
cd erlkim-ppob
pnpm install
```

### 2. Pengaturan Variabel Lingkungan (.env)
Salin fail konfigurasi standar dan sesuaikan dengan data Anda:
```bash
cp .env.example .env
```
Buka fail `.env` dan isikan data penting, terutama:
- `DATABASE_URL`: Koneksi ke PostgreSQL Anda (contoh: `postgres://user:pass@localhost:5432/ppob`)
- `ADMIN_TOKEN`: Kunci rahasia untuk masuk ke Admin Panel
- `DIGIFLAZZ_USERNAME` & `DIGIFLAZZ_API_KEY`: Kredensial akun Digiflazz Anda
- `MIDTRANS_SERVER_KEY`: (Opsional) Jika Anda menggunakan Midtrans

### 3. Setup Database PostgreSQL
Pastikan server PostgreSQL Anda berjalan dan Anda telah membuat tabel-tabel dasar (kategori, produk, transaksi, dll) sesuai skema aplikasi.

### 4. Menjalankan Backend (Rust API)
Buka terminal baru, masuk ke folder `api-rust` dan jalankan:
```bash
cd apps/api-rust
cargo run
```
API akan menyala di `http://localhost:3002`.

### 5. Menjalankan Frontend (Web Store & Admin Panel)
Di terminal lain, jalankan perintah ini dari folder utama (root):
```bash
# Menjalankan Toko Publik (Web)
pnpm --filter @erlkim-ppob/web dev

# Menjalankan Panel Admin (Admin)
pnpm --filter @erlkim-ppob/admin dev
```
- Toko PPOB Publik: `http://localhost:3000`
- Panel Admin: `http://localhost:3333`

---

## ☁️ Panduan Deployment (VPS / Production)

Jika Anda ingin mengunggahnya ke server VPS, langkah ringkasnya adalah:

1. **Build Frontend:**
   Jalankan `pnpm build` untuk memproduksi fail statis (HTML/JS/CSS) di folder `dist`. Fail statis ini bisa Anda *host* menggunakan Nginx/Apache.
2. **Compile Backend (Rust):**
   Jalankan `cargo build --release` di dalam folder `apps/api-rust`. Sebuah file biner (binary) yang sangat cepat akan dihasilkan di folder `target/release`.
3. **Jalankan Background Service:**
   Gunakan alat bantu seperti `PM2` atau `systemd` untuk menjalankan biner Rust tersebut agar terus menyala (stay-alive) di server Anda.
4. **Proxy & SSL (Direkomendasikan):**
   Gunakan **Cloudflared** (Cloudflare Tunnel) untuk keamanan ekstra, menghubungkan domain Anda langsung ke port internal (seperti 3002) tanpa harus membuka blokir *port firewall* di VPS Anda.

---
*Dibuat oleh @erlk1m*
