import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class BiController {
  async overview({ response }: HttpContext) {
    const totals = await db
      .from('occurrences')
      .select(db.raw(`count(*) as total`))
      .select(
        db.raw(`count(*) filter (where status = 'em_analise') as em_analise`),
        db.raw(`count(*) filter (where status = 'aprovada') as aprovada`),
        db.raw(`count(*) filter (where status = 'cancelada') as cancelada`),
        db.raw(`count(*) filter (where status = 'concluida') as concluida`)
      )
      .first()

    const avgResponse = await db
      .from('occurrences as o')
      .join('occurrence_responses as r', 'o.id', 'r.occurrence_id')
      .where('o.status', 'aprovada')
      .orWhere('o.status', 'concluida')
      .select(db.raw(`avg(extract(epoch from (r.created_at - o.created_at)) / 3600) as avg_hours`))
      .first()

    return response.send({
      total: Number(totals?.total ?? 0),
      by_status: {
        em_analise: Number(totals?.em_analise ?? 0),
        aprovada: Number(totals?.aprovada ?? 0),
        cancelada: Number(totals?.cancelada ?? 0),
        concluida: Number(totals?.concluida ?? 0),
      },
      avg_response_hours: avgResponse?.avg_hours ? Math.round(Number(avgResponse.avg_hours)) : null,
    })
  }

  async byCategory({ response }: HttpContext) {
    const rows = await db
      .from('occurrences as o')
      .join('occurrence_categories as c', 'o.category_id', 'c.id')
      .select('c.slug', 'c.name')
      .select(db.raw(`count(*) as total`))
      .select(
        db.raw(`count(*) filter (where o.status = 'em_analise') as em_analise`),
        db.raw(`count(*) filter (where o.status = 'aprovada') as aprovada`),
        db.raw(`count(*) filter (where o.status = 'cancelada') as cancelada`),
        db.raw(`count(*) filter (where o.status = 'concluida') as concluida`)
      )
      .groupBy('c.slug', 'c.name')
      .orderBy('total', 'desc')

    return response.send({
      data: rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        total: Number(r.total),
        by_status: {
          em_analise: Number(r.em_analise),
          aprovada: Number(r.aprovada),
          cancelada: Number(r.cancelada),
          concluida: Number(r.concluida),
        },
      })),
    })
  }

  async byNeighborhood({ request, response }: HttpContext) {
    const cityId = request.qs().city_id

    const query = db
      .from('occurrences')
      .select('neighborhood')
      .select(db.raw(`count(*) as total`))
      .select(
        db.raw(`count(*) filter (where status = 'em_analise') as em_analise`),
        db.raw(`count(*) filter (where status = 'aprovada') as aprovada`),
        db.raw(`count(*) filter (where status = 'cancelada') as cancelada`),
        db.raw(`count(*) filter (where status = 'concluida') as concluida`)
      )
      .groupBy('neighborhood')
      .orderBy('total', 'desc')
      .limit(50)

    if (cityId) query.where('city_id', cityId)

    const rows = await query

    return response.send({
      data: rows.map((r) => ({
        neighborhood: r.neighborhood,
        total: Number(r.total),
        by_status: {
          em_analise: Number(r.em_analise),
          aprovada: Number(r.aprovada),
          cancelada: Number(r.cancelada),
          concluida: Number(r.concluida),
        },
      })),
    })
  }

  async byPeriod({ request, response }: HttpContext) {
    const months = Number(request.qs().months) || 12

    const rows = await db
      .from('occurrences')
      .select(
        db.raw(`to_char(created_at, 'YYYY-MM') as period`),
        db.raw(`count(*) as total`),
        db.raw(`count(*) filter (where status = 'em_analise') as em_analise`),
        db.raw(`count(*) filter (where status = 'aprovada') as aprovada`),
        db.raw(`count(*) filter (where status = 'cancelada') as cancelada`),
        db.raw(`count(*) filter (where status = 'concluida') as concluida`)
      )
      .where('created_at', '>=', db.raw(`now() - interval '${months} months'`))
      .groupByRaw(`to_char(created_at, 'YYYY-MM')`)
      .orderBy('period', 'asc')

    return response.send({
      data: rows.map((r) => ({
        period: r.period,
        total: Number(r.total),
        by_status: {
          em_analise: Number(r.em_analise),
          aprovada: Number(r.aprovada),
          cancelada: Number(r.cancelada),
          concluida: Number(r.concluida),
        },
      })),
    })
  }

  async responseTime({ response }: HttpContext) {
    const rows = await db
      .from('occurrences as o')
      .join('occurrence_responses as r', 'o.id', 'r.occurrence_id')
      .whereIn('o.status', ['aprovada', 'concluida'])
      .select(
        db.raw(`to_char(o.created_at, 'YYYY-MM') as period`),
        db.raw(
          `avg(extract(epoch from (r.created_at - o.created_at)) / 3600) as avg_hours`
        ),
        db.raw(`count(*) as total`)
      )
      .groupByRaw(`to_char(o.created_at, 'YYYY-MM')`)
      .orderBy('period', 'asc')

    return response.send({
      data: rows.map((r) => ({
        period: r.period,
        avg_hours: Math.round(Number(r.avg_hours)),
        total: Number(r.total),
      })),
    })
  }

  async heatmap({ response }: HttpContext) {
    const rows = await db
      .from('occurrence_coordinates as c')
      .join('occurrences as o', 'c.occurrence_id', 'o.id')
      .select('c.latitude', 'c.longitude', 'o.status')
      .where('c.position', 1)

    return response.send({
      data: rows.map((r) => ({
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        status: r.status,
      })),
    })
  }
}
