import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'

export default class OccurrencePhoto extends BaseModel {
  static table = 'occurrence_photos'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare occurrenceId: string

  @column()
  declare url: string

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @beforeCreate()
  static assignUuid(row: OccurrencePhoto) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }
}
