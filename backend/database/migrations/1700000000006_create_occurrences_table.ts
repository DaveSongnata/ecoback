import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'occurrences'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('city_id').notNullable().references('id').inTable('cities').onDelete('RESTRICT')
      table
        .uuid('category_id')
        .notNullable()
        .references('id')
        .inTable('occurrence_categories')
        .onDelete('RESTRICT')
      table.string('cep', 9).notNullable()
      table.string('neighborhood', 120).notNullable()
      table.string('street', 160).notNullable()
      table.string('address', 200).notNullable()
      table.text('observation').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
