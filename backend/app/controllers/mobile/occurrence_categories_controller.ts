import type { HttpContext } from '@adonisjs/core/http'
import OccurrenceCategory from '#models/occurrence_category'

export default class OccurrenceCategoriesController {
  async index({ response }: HttpContext) {
    const rows = await OccurrenceCategory.query().orderBy('name', 'asc')
    return response.send({
      data: rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    })
  }
}
