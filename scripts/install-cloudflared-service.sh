#!/usr/bin/env bash
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared belum terinstall. Install dulu dari Cloudflare dashboard command atau package resmi."
  exit 1
fi

sudo mkdir -p /etc/cloudflared /var/log/cloudflared
sudo chown -R root:root /etc/cloudflared
sudo touch /var/log/cloudflared/admin-tunnel.log
sudo chmod 644 /var/log/cloudflared/admin-tunnel.log

if [ ! -f /etc/cloudflared/config.yml ]; then
  echo "File /etc/cloudflared/config.yml belum ada. Copy cloudflared/config.example.yml lalu edit TUNNEL_ID dan credentials-file."
  exit 1
fi

sudo cloudflared service install || true
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared --no-pager
