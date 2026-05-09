#!/usr/bin/env bash
# Cria/atualiza os arquivos .env do stack. Idempotente.
#   ./setup.sh dev    -> infra/.env.dev   (a partir de .env.dev.example)
#   ./setup.sh prod   -> infra/.env       (a partir de .env.example)
# Em ambos os casos, gera APP_KEY se estiver vazia. Não sobrescreve nada já preenchido.

set -euo pipefail

cd "$(dirname "$0")"

mode="${1:-}"
case "$mode" in
  dev)  template=".env.dev.example"; target=".env.dev" ;;
  prod) template=".env.example";     target=".env"     ;;
  *)    echo "uso: $0 dev|prod" >&2; exit 1 ;;
esac

if [[ ! -f "$template" ]]; then
  echo "template ausente: $template" >&2
  exit 1
fi

# 1. Cria o target se não existir.
if [[ ! -f "$target" ]]; then
  cp "$template" "$target"
  echo "criado: $target"
else
  echo "mantido: $target (já existia)"
fi

# 2. Gera APP_KEY se estiver vazia.
if grep -qE '^APP_KEY=\s*$' "$target"; then
  if command -v openssl >/dev/null 2>&1; then
    key="$(openssl rand -base64 32 | tr -d '\n=' | tr '/+' '_-' | cut -c1-32)"
  else
    # fallback portável (sem openssl)
    key="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c32)"
  fi
  # in-place edit compatível com GNU e BSD sed.
  if sed --version >/dev/null 2>&1; then
    sed -i -E "s|^APP_KEY=.*$|APP_KEY=${key}|" "$target"
  else
    sed -i '' -E "s|^APP_KEY=.*$|APP_KEY=${key}|" "$target"
  fi
  echo "APP_KEY gerada em $target"
else
  echo "APP_KEY já presente em $target"
fi

# 3. Em prod, mostra o que ainda está em branco e precisa ser preenchido.
if [[ "$mode" == "prod" ]]; then
  missing=()
  for var in DATABASE_URL R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_PUBLIC_URL SMTP_HOST MAIL_FROM_ADDRESS; do
    val="$(grep -E "^${var}=" "$target" | head -n1 | cut -d= -f2- || true)"
    if [[ -z "${val// }" ]] || [[ "$val" == "USER:PASSWORD@HOST:6543/postgres?sslmode=require" ]]; then
      missing+=("$var")
    fi
  done
  if (( ${#missing[@]} > 0 )); then
    echo
    echo "ATENÇÃO: edite infra/.env e preencha:"
    for v in "${missing[@]}"; do echo "  - $v"; done
    echo
    echo "Sem isso a API sobe mas vai falhar nas chamadas que dependem de cada serviço."
  fi
fi
