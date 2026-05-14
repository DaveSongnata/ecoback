import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'occurrences'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('protocol', 16).nullable().unique()
    })

    // Backfill existing rows with generated protocols
    this.schema.raw(`
      UPDATE occurrences
      SET protocol = UPPER(
        'EC' ||
        TO_CHAR(created_at, 'YYMM') || '-' ||
        SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 5)
      )
      WHERE protocol IS NULL
    `)

    this.schema.alterTable(this.tableName, (table) => {
      table.string('protocol', 16).notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('protocol')
    })
  }
}
