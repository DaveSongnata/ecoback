import vine from '@vinejs/vine'
import { birthDateRule, passwordRule, phoneRule } from '#validators/auth'

/**
 * PATCH /mobile/users/:id — every field is optional, but if provided must be valid.
 * Email uniqueness is enforced in the controller because we need to ignore
 * the current user's own row.
 */
export const updateUserValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email().maxLength(160).optional(),
    birth_date: birthDateRule.clone().optional(),
    city_id: vine
      .string()
      .uuid()
      .exists(async (db, value) => {
        const row = await db.from('cities').select('id').where('id', value).first()
        return !!row
      })
      .optional(),
    phone: phoneRule.clone().optional(),
    password: passwordRule.clone().optional(),
  })
)
