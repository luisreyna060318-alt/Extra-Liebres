#!/bin/sh
# Restaura un respaldo creado por respaldar.sh REEMPLAZANDO el contenido
# actual de la base. Antes de restaurar crea un respaldo de seguridad.
#
# Uso (con el backend detenido):
#   docker compose stop backend
#   docker compose exec respaldos sh /scripts/restaurar.sh <archivo.dump> --confirmar
#   docker compose start backend
set -eu

ARCHIVO="${1:-}"
CONFIRMACION="${2:-}"

if [ -z "$ARCHIVO" ]; then
  echo "Uso: sh /scripts/restaurar.sh <archivo.dump> --confirmar" >&2
  echo "Respaldos disponibles:" >&2
  ls -1t /respaldos/*.dump 2>/dev/null >&2 || echo "  (ninguno)" >&2
  exit 1
fi

case "$ARCHIVO" in
  /*) RUTA="$ARCHIVO" ;;
  *) RUTA="/respaldos/$ARCHIVO" ;;
esac

if [ ! -f "$RUTA" ]; then
  echo "No existe el archivo $RUTA" >&2
  exit 1
fi

if [ "$CONFIRMACION" != "--confirmar" ]; then
  echo "Esto REEMPLAZA todo el contenido de la base $PGDATABASE con $RUTA." >&2
  echo "Repite el comando agregando --confirmar al final para continuar." >&2
  exit 1
fi

echo "Creando respaldo de seguridad del estado actual..."
sh /scripts/respaldar.sh

# La extension pg_trgm no se borra ni se recrea desde el respaldo (borrarla
# exige ser su duenio y la usan los indices de busqueda): se excluye de la
# lista y solo se asegura que exista.
LISTA=$(mktemp)
trap 'rm -f "$LISTA"' EXIT
pg_restore --list "$RUTA" | grep -v " EXTENSION " > "$LISTA"
psql --quiet --dbname="$PGDATABASE" --command="CREATE EXTENSION IF NOT EXISTS pg_trgm;"

echo "Restaurando $RUTA ..."
# --single-transaction: si algo falla, la base queda exactamente como estaba.
pg_restore --clean --if-exists --no-owner --single-transaction \
  --use-list="$LISTA" --dbname="$PGDATABASE" "$RUTA"
echo "Restauracion completada."
