#!/bin/sh
set -u

TS="/var/packages/Tailscale/target/bin/tailscale"
LOG="/volume1/docker/bogdan-sites/tailscale-watchdog.txt"

{
  echo "=== ZENCHACK FUNNEL WATCHDOG ==="
  date

  if [ ! -x "$TS" ]; then
    echo "ERRORE: Tailscale non trovato in $TS"
    exit 1
  fi

  i=0
  while ! "$TS" status >/dev/null 2>&1; do
    i=$((i+1))
    if [ "$i" -ge 18 ]; then
      echo "ERRORE: Tailscale non risulta online dopo 3 minuti."
      exit 1
    fi
    echo "Tailscale non ancora pronto, attendo 10 secondi..."
    sleep 10
  done

  echo "Tailscale online. Ripristino Serve/Funnel..."

  "$TS" serve --yes --bg --https=8441 http://127.0.0.1:8081 || true
  "$TS" serve --yes --bg --https=8442 http://127.0.0.1:8082 || true
  "$TS" serve --yes --bg --https=8443 http://127.0.0.1:8083 || true
  "$TS" funnel --yes --bg --https=443 http://127.0.0.1:8090

  echo
  echo "=== FUNNEL STATUS ==="
  "$TS" funnel status || true
  echo
  echo "=== SERVE STATUS ==="
  "$TS" serve status || true
  echo
  echo "Watchdog completato."
} > "$LOG" 2>&1
