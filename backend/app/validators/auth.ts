import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import type { FieldContext } from '@vinejs/vine/types'

const ageGteThirteen = vine.createRule((value: unknown, _options: unknown, field: FieldContext) => {
  if (!(value instanceof DateTime)) return
  const today = DateTime.utc().startOf('day')
  if (today.diff(value, 'years').years < 13) {
    field.report('Must be at least 13 years old', 'min_age', field)
  }
})

export const phoneRule = vine
  .string()
  .trim()
  .minLength(10)
  .maxLength(20)
  .regex(/^[\d\s().+-]{10,20}$/)

export const passwordRule = vine.string().minLength(8).maxLength(128)

export const birthDateRule = vine.date({ formats: ['YYYY-MM-DD'] }).use(ageGteThirteen())

export const signupValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .toLowerCase()
      .email()
      .maxLength(160)
      .unique(async (db, value) => {
        const row = await db.from('users').select('id').where('email', value).first()
        return !row
      }),
    birth_date: birthDateRule.clone(),
    city_id: vine
      .string()
      .uuid()
      .exists(async (db, value) => {
        const row = await db.from('cities').select('id').where('id', value).first()
        return !!row
      }),
    phone: phoneRule.clone(),
    password: passwordRule.clone(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email(),
    password: vine.string(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email(),
  })
)
