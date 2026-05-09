import vine, { VineString, VineDate } from '@vinejs/vine'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { Database } from '@adonisjs/lucid/database'
import type { FieldContext } from '@vinejs/vine/types'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

declare module '@vinejs/vine' {
  interface VineString {
    unique(callback: (db: Database, value: string) => Promise<boolean>): this
    exists(callback: (db: Database, value: string) => Promise<boolean>): this
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

const uniqueRule = vine.createRule(
  async (
    value: unknown,
    callback: (db: Database, value: string) => Promise<boolean>,
    field: FieldContext
  ) => {
    if (typeof value !== 'string') return
    const isUnique = await callback(db, value)
    if (!isUnique) {
      field.report('The {{ field }} has already been taken', 'database.unique', field)
    }
  }
)

const existsRule = vine.createRule(
  async (
    value: unknown,
    callback: (db: Database, value: string) => Promise<boolean>,
    field: FieldContext
  ) => {
    if (typeof value !== 'string') return
    const exists = await callback(db, value)
    if (!exists) {
      field.report('The selected {{ field }} is invalid', 'database.exists', field)
    }
  }
)

VineString.macro('unique', function (this: VineString, callback) {
  return this.use(uniqueRule(callback))
})

VineString.macro('exists', function (this: VineString, callback) {
  return this.use(existsRule(callback))
})
