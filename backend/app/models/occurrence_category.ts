import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'

export default class OccurrenceCategory extends BaseModel {
  static table = 'occurrence_categories'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare slug: string

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(row: OccurrenceCategory) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }
}
