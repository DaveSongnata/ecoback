import vine from '@vinejs/vine'

const cepRule = vine
  .string()
  .trim()
  .regex(/^\d{5}-?\d{3}$/)

export const createOccurrenceValidator = vine.compile(
  vine.object({
    city_id: vine
      .string()
      .uuid()
      .exists(async (db, value) => {
        const row = await db.from('cities').select('id').where('id', value).first()
        return !!row
      }),
    category_id: vine
      .string()
      .uuid()
      .exists(async (db, value) => {
        const row = await db.from('occurrence_categories').select('id').where('id', value).first()
        return !!row
      }),
    cep: cepRule,
    neighborhood: vine.string().trim().minLength(1).maxLength(120),
    street: vine.string().trim().minLength(1).maxLength(160),
    address: vine.string().trim().minLength(1).maxLength(200),
    observation: vine.string().trim().maxLength(2000).optional().nullable(),
  })
)

export const coordinateValidator = vine.compile(
  vine
    .array(
      vine.object({
        lat: vine.number().range([-90, 90]),
        lng: vine.number().range([-180, 180]),
      })
    )
    .minLength(1)
    .maxLength(20)
)

export const listOccurrencesValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    per_page: vine.number().range([1, 100]).optional(),
  })
)
