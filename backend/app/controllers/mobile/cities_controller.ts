import type { HttpContext } from '@adonisjs/core/http'
import City from '#models/city'
import { listCitiesValidator } from '#validators/city'

export default class CitiesController {
  async index({ request, response }: HttpContext) {
    const { search } = await request.validateUsing(listCitiesValidator, {
      data: request.qs(),
    })

    const query = City.query().orderBy('name', 'asc')
    if (search) {
      query.whereILike('name', `%${search}%`)
    }
    const cities = await query

    return response.send({
      data: cities.map((c) => ({
        id: c.id,
        name: c.name,
        ibge_code: c.ibgeCode,
      })),
    })
  }
}
