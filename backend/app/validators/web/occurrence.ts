import vine from '@vinejs/vine'

export const listWebOccurrencesValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    per_page: vine.number().range([1, 100]).optional(),
    status: vine.enum(['em_analise', 'aprovada', 'cancelada', 'concluida']).optional(),
    category_id: vine.string().uuid().optional(),
    city_id: vine.string().uuid().optional(),
    neighborhood: vine.string().maxLength(120).optional(),
    date_from: vine.string().optional(),
    date_to: vine.string().optional(),
  })
)

export const approveOccurrenceValidator = vine.compile(
  vine.object({
    notice: vine.string().trim().minLength(1).maxLength(2000),
    scheduled_date: vine.string(),
    scheduled_time: vine.string().maxLength(10).optional(),
    team_name: vine.string().trim().minLength(1).maxLength(120),
  })
)

export const rejectOccurrenceValidator = vine.compile(
  vine.object({
    rejection_reason: vine.string().trim().minLength(1).maxLength(2000),
  })
)

export const completeOccurrenceValidator = vine.compile(
  vine.object({
    notice: vine.string().trim().minLength(1).maxLength(2000).optional(),
  })
)

export const exportOccurrencesValidator = vine.compile(
  vine.object({
    occurrence_ids: vine.array(vine.string().uuid()).minLength(1).maxLength(100),
  })
)
