import type { HttpContext } from '@adonisjs/core/http'
import Occurrence from '#models/occurrence'
import { apiError } from '#helpers/api_response'
import { exportOccurrencesValidator } from '#validators/web/occurrence'

export default class ExportController {
  async pdf({ request, response }: HttpContext) {
    const body = await request.validateUsing(exportOccurrencesValidator)

    const occurrences = await Occurrence.query()
      .whereIn('id', body.occurrence_ids)
      .preload('city')
      .preload('category')
      .preload('photos')
      .preload('coordinates')
      .preload('response')
      .preload('user')
      .orderBy('created_at', 'desc')

    if (occurrences.length === 0) {
      return response.status(404).send(apiError('No occurrences found', 'E_NOT_FOUND'))
    }

    const data = occurrences.map((o) => ({
      id: o.id,
      status: o.status,
      city: o.city?.name ?? '-',
      category: o.category?.name ?? '-',
      neighborhood: o.neighborhood,
      street: o.street,
      address: o.address,
      cep: o.cep,
      observation: o.observation ?? '-',
      user_email: o.user?.email ?? '-',
      user_phone: o.user?.phone ?? '-',
      photos: (o.photos ?? []).map((p) => p.url),
      coordinates: (o.coordinates ?? []).map((c) => ({
        lat: Number(c.latitude),
        lng: Number(c.longitude),
      })),
      response: o.response
        ? {
            notice: o.response.notice,
            scheduled_date: o.response.scheduledDate,
            scheduled_time: o.response.scheduledTime,
            team_name: o.response.teamName,
            rejection_reason: o.response.rejectionReason,
          }
        : null,
      created_at: o.createdAt?.toISO() ?? null,
      updated_at: o.updatedAt?.toISO() ?? null,
    }))

    // Return JSON data — PDF rendering is done client-side
    return response.send({ data })
  }
}
