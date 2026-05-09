import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const rawOrigins = env.get('CORS_ORIGINS', '')
const parsedOrigins = rawOrigins
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const corsConfig = defineConfig({
  enabled: true,
  // SPEC-DECISION: dev = open; prod = explicit allowlist via CORS_ORIGINS (comma-separated, '*' for any).
  origin: app.inDev ? true : parsedOrigins.includes('*') ? true : parsedOrigins,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
