#!/bin/sh
TS=/var/packages/Tailscale/target/bin/tailscale
LOG=/volume1/docker/bogdan-sites/tailscale-public-status.txt
{
  echo "=== CONFIGURAZIONE ACCESSO PUBBLICO PROTETTO ==="
  date
  echo
  echo "Mantengo i servizi privati Tailscale:"
  $TS serve --yes --bg --https=8441 http://127.0.0.1:8081
  $TS serve --yes --bg --https=8442 http://127.0.0.1:8082
  $TS serve --yes --bg --https=8443 http://127.0.0.1:8083
  echo
  echo "Attivo un solo Funnel pubblico su HTTPS 443 -> portale autenticato:"
  $TS funnel --yes --bg --https=443 http://127.0.0.1:8090
  echo
  echo "=== FUNNEL STATUS ==="
  $TS funnel status
  echo
  echo "=== SERVE STATUS ==="
  $TS serve status
} > "$LOG" 2>&1
