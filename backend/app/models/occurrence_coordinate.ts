import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'

export default class OccurrenceCoordinate extends BaseModel {
  static table = 'occurrence_coordinates'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare occurrenceId: string

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @beforeCreate()
  static assignUuid(row: OccurrenceCoordinate) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }
}
