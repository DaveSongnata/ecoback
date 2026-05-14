import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'staff_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE')
      table.string('permission', 50).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.unique(['staff_id', 'permission'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
