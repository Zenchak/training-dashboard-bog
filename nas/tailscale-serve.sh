#!/bin/sh
set -eu

TS="/var/packages/Tailscale/target/bin/tailscale"

if [ ! -x "$TS" ]; then
  echo "Tailscale non trovato. Installa prima il pacchetto Tailscale su DSM."
  exit 1
fi

echo "Configuro HTTPS privato sul tailnet..."

$TS serve --bg --https=8441 http://127.0.0.1:8081
$TS serve --bg --https=8442 http://127.0.0.1:8082
$TS serve --bg --https=8443 http://127.0.0.1:8083

echo
$TS serve status

echo
echo "Training: https://<nome-nas>.<tailnet>.ts.net:8441"
echo "Gare:     https://<nome-nas>.<tailnet>.ts.net:8442"
echo "Casa:     https://<nome-nas>.<tailnet>.ts.net:8443"
