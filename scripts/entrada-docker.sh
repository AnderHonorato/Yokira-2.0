#!/bin/sh
set -eu

# O volume externo do Railway pode chegar com proprietário root.
# Ajusta as permissões somente na inicialização, antes de perder privilégios.
PERSISTENTE="${RAILWAY_VOLUME_MOUNT_PATH:-${YOKIRA_VOLUME_PERSISTENTE:-}}"
if [ -n "$PERSISTENTE" ] && [ -d "$PERSISTENTE" ]; then
  chown -R node:node "$PERSISTENTE"
fi

# O servidor web e o trabalhador FFmpeg nunca operam com UID root.
exec gosu node "$@"
