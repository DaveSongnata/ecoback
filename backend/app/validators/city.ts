import vine from '@vinejs/vine'

export const listCitiesValidator = vine.compile(
  vine.object({
    search: vine.string().trim().maxLength(120).optional(),
  })
)
