import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'occurrence_photos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('occurrence_id')
        .notNullable()
        .references('id')
        .inTable('occurrences')
        .onDelete('CASCADE')
      table.text('url').notNullable()
      table.smallint('position').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.unique(['occurrence_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
