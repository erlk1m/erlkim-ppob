#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

sudo mkdir -p /etc/nginx/snippets /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/ssl/cloudflare
sudo cp "$ROOT/nginx/snippets/"*.conf /etc/nginx/snippets/
sudo cp "$ROOT/nginx/sites-available/"*.conf /etc/nginx/sites-available/

sudo ln -sf /etc/nginx/sites-available/api.erlkim.web.id.conf /etc/nginx/sites-enabled/api.erlkim.web.id.conf
sudo ln -sf /etc/nginx/sites-available/store.erlkim.web.id.conf /etc/nginx/sites-enabled/store.erlkim.web.id.conf
sudo ln -sf /etc/nginx/sites-available/admin.erlkim.web.id.conf /etc/nginx/sites-enabled/admin.erlkim.web.id.conf

sudo nginx -t
sudo systemctl reload nginx
