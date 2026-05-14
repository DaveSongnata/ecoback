import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Occurrence from '#models/occurrence'
import OccurrenceResponse from '#models/occurrence_response'
import Staff from '#models/staff'
import { apiError } from '#helpers/api_response'
import { serializeOccurrence } from '#helpers/serializers'
import {
  listWebOccurrencesValidator,
  approveOccurrenceValidator,
  rejectOccurrenceValidator,
  completeOccurrenceValidator,
} from '#validators/web/occurrence'

export default class WebOccurrencesController {
  async index({ request, response }: HttpContext) {
    const filters = await request.validateUsing(listWebOccurrencesValidator, {
      data: request.qs(),
    })

    const page = filters.page ?? 1
    const perPage = filters.per_page ?? 20

    const query = Occurrence.query()
      .preload('city')
      .preload('category')
      .preload('photos')
      .preload('coordinates')
      .preload('response')
      .preload('user')
      .orderBy('created_at', 'desc')

    if (filters.status) query.where('status', filters.status)
    if (filters.category_id) query.where('category_id', filters.category_id)
    if (filters.city_id) query.where('city_id', filters.city_id)
    if (filters.neighborhood) {
      query.whereILike('neighborhood', `%${filters.neighborhood}%`)
    }
    if (filters.date_from) query.where('created_at', '>=', filters.date_from)
    if (filters.date_to) query.where('created_at', '<=', filters.date_to)

    const paginator = await query.paginate(page, perPage)

    return response.send({
      meta: {
        page: paginator.currentPage,
        per_page: paginator.perPage,
        total: paginator.total,
      },
      data: paginator.all().map((o) => ({
        ...serializeOccurrence(o),
        user: o.user
          ? { id: o.user.id, email: o.user.email, phone: o.user.phone }
          : null,
      })),
    })
  }

  async show({ params, response }: HttpContext) {
    const occurrence = await Occurrence.query()
      .where('id', params.id)
      .preload('city')
      .preload('category')
      .preload('photos')
      .preload('coordinates')
      .preload('response')
      .preload('user')
      .first()

    if (!occurrence) {
      return response.status(404).send(apiError('Occurrence not found', 'E_NOT_FOUND'))
    }

    return response.send({
      ...serializeOccurrence(occurrence),
      user: occurrence.user
        ? { id: occurrence.user.id, email: occurrence.user.email, phone: occurrence.user.phone }
        : null,
    })
  }

  async nextForTriage({ response }: HttpContext) {
    const occurrence = await Occurrence.query()
      .where('status', 'em_analise')
      .preload('city')
      .preload('category')
      .preload('photos')
      .preload('coordinates')
      .preload('response')
      .preload('user')
      .orderBy('created_at', 'asc')
      .first()

    if (!occurrence) {
      return response.send({ data: null })
    }

    return response.send({
      data: {
        ...serializeOccurrence(occurrence),
        user: occurrence.user
          ? { id: occurrence.user.id, email: occurrence.user.email, phone: occurrence.user.phone }
          : null,
      },
    })
  }

  async approve({ auth, params, request, response }: HttpContext) {
    const staff = auth.use('web').getUserOrFail() as Staff

    const occurrence = await Occurrence.find(params.id)
    if (!occurrence) {
      return response.status(404).send(apiError('Occurrence not found', 'E_NOT_FOUND'))
    }
    if (occurrence.status !== 'em_analise') {
      return response
        .status(422)
        .send(apiError('Only occurrences in analysis can be approved', 'E_INVALID_STATUS'))
    }

    const body = await request.validateUsing(approveOccurrenceValidator)

    await db.transaction(async (trx) => {
      occurrence.status = 'aprovada'
      occurrence.useTransaction(trx)
      await occurrence.save()

      const existing = await OccurrenceResponse.query({ client: trx })
        .where('occurrence_id', occurrence.id)
        .first()

      if (existing) {
        existing.notice = body.notice
        existing.scheduledDate = body.scheduled_date
        existing.scheduledTime = body.scheduled_time ?? null
        existing.teamName = body.team_name
        existing.staffId = staff.id
        existing.useTransaction(trx)
        await existing.save()
      } else {
        await OccurrenceResponse.create(
          {
            occurrenceId: occurrence.id,
            notice: body.notice,
            scheduledDate: body.scheduled_date,
            scheduledTime: body.scheduled_time ?? null,
            teamName: body.team_name,
            staffId: staff.id,
          },
          { client: trx }
        )
      }
    })

    await occurrence.load((loader) => {
      loader.load('city').load('category').load('photos').load('coordinates').load('response')
    })

    return response.send(serializeOccurrence(occurrence))
  }

  async reject({ auth, params, request, response }: HttpContext) {
    const staff = auth.use('web').getUserOrFail() as Staff

    const occurrence = await Occurrence.find(params.id)
    if (!occurrence) {
      return response.status(404).send(apiError('Occurrence not found', 'E_NOT_FOUND'))
    }
    if (occurrence.status !== 'em_analise') {
      return response
        .status(422)
        .send(apiError('Only occurrences in analysis can be rejected', 'E_INVALID_STATUS'))
    }

    const body = await request.validateUsing(rejectOccurrenceValidator)

    await db.transaction(async (trx) => {
      occurrence.status = 'cancelada'
      occurrence.useTransaction(trx)
      await occurrence.save()

      const existing = await OccurrenceResponse.query({ client: trx })
        .where('occurrence_id', occurrence.id)
        .first()

      if (existing) {
        existing.rejectionReason = body.rejection_reason
        existing.staffId = staff.id
        existing.notice = body.rejection_reason
        existing.teamName = '-'
        existing.useTransaction(trx)
        await existing.save()
      } else {
        await OccurrenceResponse.create(
          {
            occurrenceId: occurrence.id,
            notice: body.rejection_reason,
            rejectionReason: body.rejection_reason,
            teamName: '-',
            staffId: staff.id,
          },
          { client: trx }
        )
      }
    })

    await occurrence.load((loader) => {
      loader.load('city').load('category').load('photos').load('coordinates').load('response')
    })

    return response.send(serializeOccurrence(occurrence))
  }

  async complete({ auth, params, request, response }: HttpContext) {
    const staff = auth.use('web').getUserOrFail() as Staff

    const occurrence = await Occurrence.find(params.id)
    if (!occurrence) {
      return response.status(404).send(apiError('Occurrence not found', 'E_NOT_FOUND'))
    }
    if (occurrence.status !== 'aprovada') {
      return response
        .status(422)
        .send(apiError('Only approved occurrences can be completed', 'E_INVALID_STATUS'))
    }

    const body = await request.validateUsing(completeOccurrenceValidator)

    await db.transaction(async (trx) => {
      occurrence.status = 'concluida'
      occurrence.useTransaction(trx)
      await occurrence.save()

      const existing = await OccurrenceResponse.query({ client: trx })
        .where('occurrence_id', occurrence.id)
        .first()

      if (existing) {
        if (body.notice) existing.notice = body.notice
        existing.staffId = staff.id
        existing.useTransaction(trx)
        await existing.save()
      }
    })

    await occurrence.load((loader) => {
      loader.load('city').load('category').load('photos').load('coordinates').load('response')
    })

    return response.send(serializeOccurrence(occurrence))
  }
}
