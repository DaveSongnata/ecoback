/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  TZ: Env.schema.string.optional(),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Database (single connection string; works for local Postgres and Supabase)
  DATABASE_URL: Env.schema.string(),

  // Storage switch
  USE_CLOUDFLARE_R2: Env.schema.boolean(),

  // Cloudflare R2 (used when USE_CLOUDFLARE_R2=true)
  R2_ACCOUNT_ID: Env.schema.string.optional(),
  R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  R2_BUCKET: Env.schema.string.optional(),
  R2_PUBLIC_URL: Env.schema.string.optional({ format: 'url', tld: false }),

  // Local storage (used when USE_CLOUDFLARE_R2=false)
  LOCAL_STORAGE_PATH: Env.schema.string.optional(),
  LOCAL_STORAGE_PUBLIC_URL: Env.schema.string.optional({ format: 'url', tld: false }),

  // Mail
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string(),
  MAIL_FROM_NAME: Env.schema.string(),

  // Limiter
  LIMITER_STORE: Env.schema.enum(['memory', 'database'] as const),

  // CORS — comma-separated list of allowed origins; '*' for any (dev only)
  CORS_ORIGINS: Env.schema.string.optional(),
})
