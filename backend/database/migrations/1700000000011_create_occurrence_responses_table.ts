import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'occurrence_responses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('occurrence_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('occurrences')
        .onDelete('CASCADE')
      table.text('notice').notNullable()
      table.date('scheduled_date').nullable()
      table.string('scheduled_time', 10).nullable()
      table.string('team_name', 120).notNullable()
      table.uuid('staff_id').nullable()
      table.text('rejection_reason').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
