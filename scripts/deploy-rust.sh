#!/bin/bash
# Script Deployment Khusus untuk Rust Backend (api-rust)

echo "======================================================"
echo "🦀 Memulai Deployment API RUST (api-rust)"
echo "======================================================"

# 1. Pastikan berada di direktori api-rust
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../apps/api-rust" && pwd )"
cd "$DIR"
echo "📁 Direktori kerja: $DIR"

# 2. Cek apakah Rust/Cargo sudah terinstal
if ! command -v cargo &> /dev/null; then
    echo "⚠️ Cargo (Rust) belum terinstal di server ini!"
    echo "📦 Menginstall Rust via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Memuat environment variables dari Rust
    source "$HOME/.cargo/env"
    echo "✅ Rust berhasil diinstal."
else
    echo "✅ Rust/Cargo sudah terinstal."
fi

# 3. Proses Build (Kompilasi ke Binary Linux)
echo "🏗️ Memulai kompilasi (Release Build). Ini mungkin memakan waktu beberapa menit..."
cargo build --release

if [ $? -ne 0 ]; then
    echo "❌ Gagal melakukan kompilasi Rust. Silakan cek log di atas."
    exit 1
fi

echo "✅ Kompilasi berhasil!"

# 4. Konfigurasi PM2
echo "🚀 Mengatur Service PM2 untuk api-rust..."

if pm2 show ppob-api-rust > /dev/null 2>&1; then
    echo "🔄 Me-restart ppob-api-rust..."
    pm2 restart ppob-api-rust
else
    echo "▶️ Menjalankan ppob-api-rust untuk pertama kali..."
    # Menjalankan binary hasil kompilasi
    pm2 start target/release/api-rust --name ppob-api-rust
fi

pm2 save

echo "======================================================"
echo "✅ Deployment Rust Backend Selesai!"
echo "Server Rust sekarang berjalan di latar belakang via PM2 (Port 3002)."
echo "Cek status: pm2 status ppob-api-rust"
echo "Cek log: pm2 logs ppob-api-rust"
echo "======================================================"
