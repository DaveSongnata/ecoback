import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
  }

  async down() {
    // pgcrypto is harmless to leave installed; do not drop on rollback.
  }
}
