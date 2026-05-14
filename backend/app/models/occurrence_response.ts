import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Occurrence from '#models/occurrence'

export default class OccurrenceResponse extends BaseModel {
  static table = 'occurrence_responses'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare occurrenceId: string

  @column()
  declare notice: string

  @column()
  declare scheduledDate: string | null

  @column()
  declare scheduledTime: string | null

  @column()
  declare teamName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Occurrence)
  declare occurrence: BelongsTo<typeof Occurrence>

  @beforeCreate()
  static assignUuid(row: OccurrenceResponse) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }
}
