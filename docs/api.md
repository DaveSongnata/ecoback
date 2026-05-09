# EcoBack API — Referência

Base URL (dev): `http://localhost:38383`
Prefixo de todas as rotas mobile: `/mobile`
Auth: `Authorization: Bearer <token>` (access tokens opacos, válidos por 30 dias).

## Sumário

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/`                              | —    | Health check |
| POST   | `/mobile/signup`                 | —    | Cria conta |
| POST   | `/mobile/login`                  | —    | Emite token |
| POST   | `/mobile/forgot-password`        | —    | Envia senha temporária por e-mail |
| GET    | `/mobile/cities`                 | —    | Lista cidades |
| GET    | `/mobile/occurrence-categories`  | —    | Lista categorias |
| GET    | `/mobile/users/:id`              | bearer + owner | Perfil do usuário |
| PATCH  | `/mobile/users/:id`              | bearer + owner | Atualiza perfil |
| POST   | `/mobile/occurrences`            | bearer | Registra ocorrência (multipart) |
| GET    | `/mobile/occurrences`            | bearer | Lista ocorrências do usuário |
| GET    | `/mobile/occurrences/:id`        | bearer | Detalhe de ocorrência |

## Erros

Toda rota retorna o mesmo envelope em caso de falha:

```json
{
  "errors": [
    { "message": "string", "field": "optional", "code": "optional" }
  ]
}
```

| Status | Quando |
|---|---|
| 400 | Validação de entrada |
| 401 | Token ausente, expirado, inválido |
| 403 | Autenticado mas tentou acessar recurso de outro usuário |
| 404 | Recurso não existe (ou ocorrência de outro usuário — não vaza existência) |
| 409 | Conflito (raro) |
| 422 | Regra de negócio violada |
| 429 | Rate limit (`/login` e `/forgot-password`: 5 req / 5 min / IP) |
| 500 | Erro interno |

---

## POST `/mobile/signup`

`Content-Type: multipart/form-data`

| Campo | Tipo | Regras |
|---|---|---|
| `email` | string | required, email, unique, lowercase |
| `birth_date` | `YYYY-MM-DD` | required, idade ≥ 13 |
| `city_id` | UUID | required, deve existir |
| `phone` | string | required, 10–15 dígitos (máscara aceita, salva só dígitos) |
| `password` | string | required, mín 8 |
| `profile_photo` | file | opcional; jpg/png/webp; ≤ 5 MB |

**201 Created**
```json
{
  "success": true,
  "token": {
    "type": "bearer",
    "value": "oat_...",
    "expires_at": "2026-06-08T07:22:38.562Z"
  },
  "user": {
    "id": "uuid",
    "email": "string",
    "profile_photo_url": "string|null"
  }
}
```

```bash
curl -X POST http://localhost:38383/mobile/signup \
  -F email=user@example.com \
  -F birth_date=1995-05-10 \
  -F city_id=$CITY_ID \
  -F phone=11987654321 \
  -F password=password123 \
  -F profile_photo=@./avatar.jpg
```

---

## POST `/mobile/login`

`Content-Type: application/json`

```json
{ "email": "string", "password": "string" }
```

**200 OK**
```json
{
  "success": true,
  "token": { "type": "bearer", "value": "oat_...", "expires_at": "..." }
}
```

**401** com mensagem genérica `"Invalid credentials"` para não diferenciar email vs senha.

```bash
curl -X POST http://localhost:38383/mobile/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## POST `/mobile/forgot-password`

`Content-Type: application/json`

```json
{ "email": "string" }
```

**200 OK** (sempre, mesmo se o email não existir — anti-enumeration):
```json
{ "success": true, "message": "If the email exists, a new password has been sent." }
```

Quando o email existe: gera senha aleatória (12 chars), atualiza o usuário, **invalida todos os tokens existentes** e envia por e-mail.

```bash
curl -X POST http://localhost:38383/mobile/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com"}'
```

---

## GET `/mobile/users/:id`

Auth: bearer + owner-only (precisa ser o próprio usuário).

**200 OK**
```json
{
  "id": "uuid",
  "profile_photo_url": "string|null",
  "email": "string",
  "birth_date": "YYYY-MM-DD",
  "city": { "id": "uuid", "name": "string", "ibge_code": "string" },
  "phone": "string"
}
```

> A senha (mesmo hasheada) **não é retornada**.

```bash
curl http://localhost:38383/mobile/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## PATCH `/mobile/users/:id`

Auth: bearer + owner-only. `Content-Type: multipart/form-data` (todos os campos opcionais).

| Campo | Regras |
|---|---|
| `email` | unique se mudou |
| `birth_date` | mesma do signup |
| `city_id` | mesma do signup |
| `phone` | mesma do signup |
| `password` | mesma do signup; **invalida todos os tokens** existentes |
| `profile_photo` | mesma do signup; deleta a foto antiga ao salvar a nova |

**200 OK** — mesmo shape do GET.

```bash
curl -X PATCH http://localhost:38383/mobile/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F phone=11999990000 \
  -F profile_photo=@./novo.jpg
```

---

## GET `/mobile/cities`

Query: `?search=string` (opcional, case-insensitive).

**200 OK**
```json
{
  "data": [
    { "id": "uuid", "name": "string", "ibge_code": "string" }
  ]
}
```

---

## GET `/mobile/occurrence-categories`

**200 OK**
```json
{
  "data": [
    { "id": "uuid", "slug": "organic", "name": "Orgânico" }
  ]
}
```

Slugs disponíveis: `organic`, `recyclable`, `special`, `hospital`, `others`.

---

## POST `/mobile/occurrences`

Auth: bearer. `Content-Type: multipart/form-data`.

| Campo | Tipo | Regras |
|---|---|---|
| `city_id` | UUID | required, deve existir |
| `category_id` | UUID | required, deve existir |
| `cep` | string | required, `00000-000` ou `00000000` |
| `neighborhood` | string | required |
| `street` | string | required |
| `address` | string | required (número/complemento) |
| `observation` | string | opcional |
| `photos[]` | file × 1..3 | required, jpg/png/webp, ≤ 8 MB cada |
| `coordinates` | string JSON | required, array com 1..20 itens `{ "lat": number, "lng": number }` |

A criação é transacional. Se o salvamento das fotos no storage ou a inserção falhar, tudo é desfeito (rollback no banco + delete dos uploads).

**201 Created** — ver `GET /mobile/occurrences/:id`.

```bash
curl -X POST http://localhost:38383/mobile/occurrences \
  -H "Authorization: Bearer $TOKEN" \
  -F city_id=$CITY_ID \
  -F category_id=$CATEGORY_ID \
  -F cep=01001-000 \
  -F neighborhood=Centro \
  -F street="Rua A" \
  -F address=100 \
  -F observation="lixo na esquina" \
  -F 'coordinates=[{"lat":-23.55,"lng":-46.63}]' \
  -F photos=@./foto1.jpg \
  -F photos=@./foto2.jpg
```

---

## GET `/mobile/occurrences`

Auth: bearer. Lista as ocorrências **do próprio usuário**.

Query: `?page=1&per_page=20` (`per_page` máx 100).

**200 OK**
```json
{
  "meta": { "page": 1, "per_page": 20, "total": 0 },
  "data": [ /* shape igual ao GET /:id */ ]
}
```

---

## GET `/mobile/occurrences/:id`

Auth: bearer. Retorna **404** se a ocorrência não pertence ao usuário (não vaza existência).

**200 OK**
```json
{
  "id": "uuid",
  "city": { "id": "uuid", "name": "string", "ibge_code": "string" },
  "category": { "id": "uuid", "slug": "string", "name": "string" },
  "cep": "string",
  "neighborhood": "string",
  "street": "string",
  "address": "string",
  "observation": "string|null",
  "photos": [
    { "position": 1, "url": "string" }
  ],
  "coordinates": [
    { "position": 1, "lat": 0.0, "lng": 0.0 }
  ],
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

---

## Convenções

- **UUIDs v4** em todas as PKs (gerados pela aplicação no `@beforeCreate`, não pelo SQL).
- **Datas ISO-8601** em respostas; `YYYY-MM-DD` quando só data.
- **Telefone** salvo como dígitos puros — máscara é aceita na entrada e descartada.
- **CEP** aceita `00000-000` ou `00000000` na entrada; salvo como veio.
- **Storage**: em dev, fotos servidas em `/uploads/<key>`; em prod, na CDN configurada (`R2_PUBLIC_URL`).
