#!/usr/bin/env bash
set -euo pipefail
PROJECT="${1:-/var/www/erlkim-ppob-digiflazz}"
cd "$PROJECT"

echo "== v34 scheduler clean test =="
[ -x scripts/scheduler-clean-vps.sh ] || { echo "FAIL scheduler-clean-vps.sh missing"; exit 1; }
[ -x scripts/scheduler-status-vps.sh ] || { echo "FAIL scheduler-status-vps.sh missing"; exit 1; }

bash scripts/scheduler-clean-vps.sh --once
pm2 describe ppob-scheduler >/tmp/ppob-scheduler-describe.txt 2>/dev/null || { echo "FAIL ppob-scheduler not in PM2"; exit 1; }
grep -q "online" /tmp/ppob-scheduler-describe.txt || { echo "WARN ppob-scheduler may not be online"; cat /tmp/ppob-scheduler-describe.txt | head -60; }

tail -20 storage/logs/scheduler-clean.log || true

echo "V34 SCHEDULER CLEAN OK"
