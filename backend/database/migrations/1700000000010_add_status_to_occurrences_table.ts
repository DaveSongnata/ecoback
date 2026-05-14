import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'occurrences'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', ['em_analise', 'aprovada', 'cancelada'], {
          useNative: true,
          enumName: 'occurrence_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('em_analise')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })
    this.schema.raw('DROP TYPE IF EXISTS "occurrence_status"')
  }
}
