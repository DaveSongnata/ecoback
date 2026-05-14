import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import StaffPermission from '#models/staff_permission'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class Staff extends compose(BaseModel, AuthFinder) {
  static table = 'staff'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => StaffPermission)
  declare permissions: HasMany<typeof StaffPermission>

  static accessTokens = DbAccessTokensProvider.forModel(Staff, {
    expiresIn: '12 hours',
    table: 'staff_access_tokens',
  })
  declare currentAccessToken?: AccessToken

  @beforeCreate()
  static assignUuid(row: Staff) {
    if (!row.id) {
      row.id = randomUUID()
    }
  }

  get permissionSlugs(): string[] {
    return (this.permissions ?? []).map((p) => p.permission)
  }

  hasPermission(permission: string): boolean {
    return this.permissionSlugs.includes(permission)
  }
}
