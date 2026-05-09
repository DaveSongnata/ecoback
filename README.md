# EcoBack — Mobile API (AdonisJS v6)

Monorepo com a API, infra Docker e um front demo para registrar ocorrências de lixo em locais específicos.

## Layout

```
.
├── backend/      # API AdonisJS (TypeScript, Lucid, Auth tokens, Drive, Mail)
├── frontend/    # Demo HTML/CSS/JS puro (sem build) para exercitar a API
├── infra/       # Docker Compose (dev/prod), Dockerfile, setup scripts
└── docs/        # Referência da API (docs/api.md)
```

## Como rodar — DEV

A stack sobe **Postgres 16**, **Mailpit**, a **API** AdonisJS e o **frontend demo**. Migrations + seeds (`cities`, `occurrence_categories`) rodam automaticamente no boot.

Portas no host (todas exóticas, pra evitar conflito com qualquer coisa que já esteja rodando):

| Serviço | Host | Container | Acesso |
|---|---|---|---|
| API | `38383` | 3333 | http://localhost:38383 |
| Frontend demo | `48080` | 80 | http://localhost:48080 |
| Mailpit UI | `18025` | 8025 | http://localhost:18025 |
| Mailpit SMTP | `1025` | 1025 | — |
| Postgres | `5439` | 5432 | `postgres://app:app@localhost:5439/app` |

### Linux / macOS

```bash
cd infra
make dev
```

Sem `make`:
```bash
cd infra
./setup.sh dev
docker compose -f docker-compose.dev.yml up
```

### Windows

Pré-requisitos: **Docker Desktop** (com WSL2 backend) + **PowerShell 5.1+** (já vem no Windows 10/11).

```powershell
cd infra
.\setup.ps1 dev
docker compose -f docker-compose.dev.yml up
```

Se tiver **Git Bash** instalado, o caminho Linux funciona idêntico (`./setup.sh dev` + `docker compose ... up`).

> **Performance:** clone o repo dentro do filesystem do WSL (`\\wsl$\Ubuntu\home\...`), não em `C:\`. Bind mounts de `C:\` para containers Linux são lentíssimos via 9P.
>
> **HMR não atualiza?** No PowerShell, antes do `docker compose up`:
> ```powershell
> $env:CHOKIDAR_USEPOLLING="true"
> ```
> Isso força polling para detecção de mudança em FS via 9P/WSL.

### SELinux (Fedora/RHEL/CentOS)

Os bind mounts já estão marcados com `:z` — destrava o "Permission denied" do SELinux Enforcing. No Windows e macOS o flag é no-op.

## Como rodar — PROD

**Linux/macOS:**
```bash
cd infra
make prod                 # cria infra/.env, gera APP_KEY, lista o que falta
$EDITOR .env              # preencha DATABASE_URL, R2_*, SMTP_*
make prod                 # roda de novo: agora sobe a API
```

**Windows (PowerShell):**
```powershell
cd infra
.\setup.ps1 prod          # cria infra\.env, gera APP_KEY, lista o que falta
notepad .env              # preencha DATABASE_URL, R2_*, SMTP_*
docker compose -f docker-compose.prod.yml up -d
```

O `setup` é idempotente — rodar de novo não sobrescreve o que você já preencheu.

**O que precisa ser preenchido em `infra/.env`** (gerado a partir de `infra/.env.example`):

| Variável | Origem | Notas |
|---|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string | Use a versão **Transaction pooler** com `?sslmode=require` |
| `R2_ACCOUNT_ID` | Cloudflare → R2 → "Account ID" da conta | |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → "Manage R2 API Tokens" → Create API token | Permissão Read/Write no bucket |
| `R2_BUCKET` | Nome do bucket que você criou | |
| `R2_PUBLIC_URL` | Cloudflare → R2 → bucket → Settings → Public URL (ou seu domínio CDN) | Sem barra final |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | Seu provedor (Resend, SendGrid, SES, Brevo, Mailgun, etc.) | |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | Remetente que aparece nos e-mails | |
| `CORS_ORIGINS` | Domínios permitidos pelo browser | Vírgula-separado; `*` = liberado (não recomendado) |

**Não preencha** `APP_KEY` — o `setup.sh` já gerou.

`USE_CLOUDFLARE_R2=1` é forçado no `docker-compose.prod.yml` (não tem como esquecer).

## Em qualquer máquina

| SO | Dependências obrigatórias | Opcionais |
|---|---|---|
| Linux | Docker + bash + openssl | make |
| macOS | Docker Desktop | make |
| Windows | Docker Desktop (WSL2) + PowerShell 5.1+ | Git Bash (alternativa ao PowerShell) |

Nada de Node/Postgres instalado localmente — tudo roda em container.

## Alternando local ↔ nuvem

Apenas duas variáveis controlam o destino:

| Recurso | Variável | Efeito |
|---|---|---|
| Banco | `DATABASE_URL` | Postgres local em dev; URL do Supabase em prod |
| Storage | `USE_CLOUDFLARE_R2` | `0` = filesystem; `1` = R2 |

## Comandos úteis

Dentro de `backend/`:

```bash
npm run dev              # serve com HMR
npm run build            # compila para ./build
npm start                # roda a build (use NODE_ENV=production)
npm run lint
npm run typecheck
npm run format
npm test                 # Japa — exige Postgres ativo (ver abaixo)

node ace migration:run
node ace db:seed
```

## Frontend demo

Página única em `frontend/` (HTML+CSS+JS puro, sem build). Sobe junto com a stack em http://localhost:48080. Demonstra: login, signup com upload de avatar, recuperação de senha, criar ocorrência (com fotos e geolocation), listar ocorrências, ver perfil.

> O front aponta para `http://localhost:38383` por padrão. Para apontar para outra base URL adicione `<meta name="api-base" content="https://...">` no `<head>` do `index.html`.

## Documentação

- [docs/api.md](docs/api.md) — referência completa: payloads, status codes, exemplos curl.

## Rotas

Prefixo: `/mobile`. Detalhes em `backend/start/routes.ts`.

| Método | Rota | Auth |
|---|---|---|
| POST | `/mobile/signup` | — |
| POST | `/mobile/login` | — |
| POST | `/mobile/forgot-password` | — |
| GET | `/mobile/cities` | — |
| GET | `/mobile/occurrence-categories` | — |
| GET | `/mobile/users/:id` | bearer + owner |
| PATCH | `/mobile/users/:id` | bearer + owner |
| POST | `/mobile/occurrences` | bearer |
| GET | `/mobile/occurrences` | bearer |
| GET | `/mobile/occurrences/:id` | bearer |

Resposta de erro padrão para qualquer rota:

```json
{ "errors": [{ "message": "...", "field": "optional", "code": "optional" }] }
```

## Storage

O `StorageService` (`app/services/storage_service.ts`) é o único ponto que olha `USE_CLOUDFLARE_R2`.
Controllers chamam `storageService.upload(file, folder)` e nunca falam direto com o env ou com o `drive`.

## Testes

Os testes funcionais usam um Postgres real. O caminho mais simples:

```bash
# Sobe a stack de dev (cria o banco "app")
docker compose -f infra/docker-compose.dev.yml up -d postgres

# Cria um banco separado para testes
docker exec ecoback_postgres_dev createdb -U app app_test

cd backend
npm test
```

`.env.test` aponta para `app_test`. As migrations rodam uma vez (`runnerHooks.setup`); cada teste limpa as tabelas via `testUtils.db().truncate()`.

## Decisões marcadas

Procure por `SPEC-DECISION:` no código para encontrar pontos onde o spec deixou margem e a decisão tomada está documentada inline. Resumo:

- Reset de senha por senha aleatória (conforme pedido). Marcado para refator futuro com fluxo de token.
- `password` removido da resposta do GET de usuário — vazamento sem ganho de UX.
- 404 (não 403) ao tentar ler ocorrência alheia — não vaza existência.
- `category=others` não exige `observation` no backend; regra fica no front.
- UUIDs gerados pela aplicação (hook `@beforeCreate`) em vez de `gen_random_uuid()` no SQL — mais portável.
