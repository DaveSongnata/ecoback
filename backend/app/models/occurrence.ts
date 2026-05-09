import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import City from '#models/city'
import User from '#models/user'
import OccurrenceCategory from '#models/occurrence_category'
import OccurrencePhoto from '#models/occurrence_photo'
import OccurrenceCoordinate from '#models/occurrence_coordinate'

export default class Occurrence extends BaseModel {
  static table = 'occurrences'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare cityId: string

  @column()
  declare categoryId: string

  @column()
  declare cep: string

  @column()
  declare neighborhood: string

  @column()
  declare street: string

  @column()
  declare address: string

  @column()
  declare observation: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => City)
  declare city: BelongsTo<typeof City>

  @belongsTo(() => OccurrenceCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof OccurrenceCategory>

  @hasMany(() => OccurrencePhoto, { foreignKey: 'occurrenceId' })
  declare photos: HasMany<typeof OccurrencePhoto>

  @hasMany(() => OccurrenceCoordinate, { foreignKey: 'occurrenceId' })
  declare coordinates: HasMany<typeof OccurrenceCoordinate>

  @beforeCreate()
  static assignUuid(row: Occurrence) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }
}
