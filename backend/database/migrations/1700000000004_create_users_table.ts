import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.text('profile_photo_url').nullable()
      table.string('email', 160).notNullable().unique()
      table.date('birth_date').notNullable()
      table.uuid('city_id').notNullable().references('id').inTable('cities').onDelete('RESTRICT')
      table.string('phone', 20).notNullable()
      table.text('password').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
