import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('occurrence_responses', (table) => {
      table.foreign('staff_id').references('id').inTable('staff').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('occurrence_responses', (table) => {
      table.dropForeign('staff_id')
    })
  }
}
