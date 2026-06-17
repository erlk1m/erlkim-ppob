#!/bin/bash
# Universal Deploy Script for VPS (Ubuntu/Debian)

echo "======================================================"
echo "🚀 Memulai Universal Deployment ERLKIM PPOB DIGIFLAZZ"
echo "======================================================"

# Pastikan berada di root proyek
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd $DIR
echo "📁 Direktori kerja: $DIR"

# Install global tools
if ! command -v pnpm &> /dev/null; then
    echo "📦 Menginstall pnpm..."
    npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Menginstall pm2..."
    npm install -g pm2
fi

echo "🔄 Menginstall dependencies proyek..."
pnpm install

echo "🏗️ Membangun (Build) seluruh package..."
pnpm run build

echo "🚀 Konfigurasi & Memulai PM2 Services..."

# 1. PPOB API
if pm2 show ppob-api > /dev/null 2>&1; then
    echo "Restarting ppob-api..."
    pm2 restart ppob-api
else
    echo "Starting ppob-api..."
    pm2 start pnpm --name ppob-api -- --filter @my-ppob/api exec tsx src/index.ts
fi

# 2. PPOB Admin
if pm2 show ppob-admin > /dev/null 2>&1; then
    echo "Restarting ppob-admin..."
    pm2 restart ppob-admin
else
    echo "Starting ppob-admin..."
    pm2 start bash --name ppob-admin -- -lc "pnpm --filter @my-ppob/admin preview -- --host 0.0.0.0 --port 3333"
fi

# 3. PPOB Web
if pm2 show ppob-web > /dev/null 2>&1; then
    echo "Restarting ppob-web..."
    pm2 restart ppob-web
else
    echo "Starting ppob-web..."
    pm2 start apps/web/server.cjs --name ppob-web
fi

# 4. PPOB Scheduler
if pm2 show ppob-scheduler > /dev/null 2>&1; then
    echo "Restarting ppob-scheduler..."
    pm2 restart ppob-scheduler
else
    echo "Starting ppob-scheduler..."
    pm2 start scripts/scheduler-clean-vps.sh --name ppob-scheduler --interpreter bash
fi

echo "💾 Menyimpan konfigurasi PM2 startup..."
pm2 save

echo "======================================================"
echo "✅ Deployment Universal Selesai!"
echo "Semua service sekarang berjalan di latar belakang (PM2)."
echo "Silakan periksa statusnya dengan perintah: pm2 status"
echo "======================================================"
