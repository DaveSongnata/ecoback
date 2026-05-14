import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Staff from '#models/staff'

export const VALID_PERMISSIONS = [
  'occurrences:triage',
  'occurrences:export',
  'bi:view',
  'staff:manage',
] as const

export type Permission = (typeof VALID_PERMISSIONS)[number]

export default class StaffPermission extends BaseModel {
  static table = 'staff_permissions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare staffId: string

  @column()
  declare permission: Permission

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Staff)
  declare staff: BelongsTo<typeof Staff>

  @beforeCreate()
  static assignUuid(row: StaffPermission) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }
}
