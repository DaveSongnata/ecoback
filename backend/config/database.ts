import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'pg',

  connections: {
    pg: {
      client: 'pg',
      connection: env.get('DATABASE_URL'),
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      seeders: {
        paths: ['database/seeders'],
      },
      // SPEC-DECISION: keep schemaGeneration off — we use explicit Lucid models with decorators
      // since the spec defines several tables with relationships and UUID PKs.
      schemaGeneration: {
        enabled: false,
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig
