import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'occurrence_coordinates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('occurrence_id')
        .notNullable()
        .references('id')
        .inTable('occurrences')
        .onDelete('CASCADE')
      table.decimal('latitude', 10, 7).notNullable()
      table.decimal('longitude', 10, 7).notNullable()
      table.smallint('position').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.unique(['occurrence_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
