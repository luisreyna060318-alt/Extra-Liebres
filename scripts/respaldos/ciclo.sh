#!/bin/sh
# Punto de entrada del servicio "respaldos": un respaldo al arrancar y luego
# uno cada INTERVALO_HORAS horas.
set -u

INTERVALO=$(( ${INTERVALO_HORAS:-24} * 3600 ))

while true; do
  if ! sh /scripts/respaldar.sh; then
    echo "$(date '+%F %T') ERROR: el respaldo fallo" >&2
  fi
  sleep "$INTERVALO"
done
