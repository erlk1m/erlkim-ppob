#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp)"
{
  echo "# Generated from Cloudflare IP ranges on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "real_ip_header CF-Connecting-IP;"
  echo "real_ip_recursive on;"
  curl -fsSL https://www.cloudflare.com/ips-v4 | sed 's/^/set_real_ip_from /; s/$/;/'
  curl -fsSL https://www.cloudflare.com/ips-v6 | sed 's/^/set_real_ip_from /; s/$/;/'
} > "$TMP"

sudo cp "$TMP" /etc/nginx/snippets/cloudflare-real-ip.conf
rm -f "$TMP"
sudo nginx -t
sudo systemctl reload nginx
