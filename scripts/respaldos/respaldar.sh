#!/bin/sh
# Crea un respaldo comprimido (formato personalizado de pg_dump) y borra los
# que tengan mas de RETENCION_DIAS dias. Usa PGHOST/PGUSER/PGPASSWORD/PGDATABASE.
set -eu

DESTINO=/respaldos
FECHA=$(date +%Y%m%d-%H%M%S)
ARCHIVO="$DESTINO/${PGDATABASE}-${FECHA}.dump"

# Se escribe a un temporal y se renombra al final para que nunca quede un
# respaldo a medias con nombre de respaldo valido.
pg_dump --format=custom --file="$ARCHIVO.tmp"
mv "$ARCHIVO.tmp" "$ARCHIVO"
echo "$(date '+%F %T') Respaldo creado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

find "$DESTINO" -name "${PGDATABASE}-*.dump" -mtime +"${RETENCION_DIAS:-14}" -print -delete
