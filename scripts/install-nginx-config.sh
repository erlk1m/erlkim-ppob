#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

sudo mkdir -p /etc/nginx/snippets /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/ssl/cloudflare
sudo cp "$ROOT/nginx/snippets/"*.conf /etc/nginx/snippets/
sudo cp "$ROOT/nginx/sites-available/"*.conf /etc/nginx/sites-available/

sudo ln -sf /etc/nginx/sites-available/api.example.com.conf /etc/nginx/sites-enabled/api.example.com.conf
sudo ln -sf /etc/nginx/sites-available/store.example.com.conf /etc/nginx/sites-enabled/store.example.com.conf
sudo ln -sf /etc/nginx/sites-available/admin.example.com.conf /etc/nginx/sites-enabled/admin.example.com.conf

sudo nginx -t
sudo systemctl reload nginx
