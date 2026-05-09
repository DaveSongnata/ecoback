import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import City from '#models/city'
import Occurrence from '#models/occurrence'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare profilePhotoUrl: string | null

  @column()
  declare email: string

  @column.date()
  declare birthDate: DateTime

  @column()
  declare cityId: string

  @column()
  declare phone: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => City)
  declare city: BelongsTo<typeof City>

  @hasMany(() => Occurrence)
  declare occurrences: HasMany<typeof Occurrence>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
  })
  declare currentAccessToken?: AccessToken

  @beforeCreate()
  static assignUuid(user: User) {
    if (!user.id) {
      user.id = randomUUID()
    }
  }
}
