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

  async heatmap({ request, response }: HttpContext) {
    // Grid precision: 3 decimal places ≈ 110m cells
    // Aggregates millions of points into a few thousand cells
    const precision = Number(request.qs().precision) || 3
    const clampedPrecision = Math.min(Math.max(precision, 2), 5)

    const rows = await db
      .from('occurrence_coordinates as c')
      .join('occurrences as o', 'c.occurrence_id', 'o.id')
      .where('c.position', 1)
      .select(
        db.raw(`ROUND(c.latitude::numeric, ${clampedPrecision}) as lat`),
        db.raw(`ROUND(c.longitude::numeric, ${clampedPrecision}) as lng`),
        db.raw(`count(*)::int as weight`)
      )
      .groupByRaw(`ROUND(c.latitude::numeric, ${clampedPrecision}), ROUND(c.longitude::numeric, ${clampedPrecision})`)

    return response.send({
      data: rows.map((r) => ({
        lat: Number(r.lat),
        lng: Number(r.lng),
        weight: r.weight,
      })),
    })
  }

  async areas({ request, response }: HttpContext) {
    const status = request.qs().status
    const limit = Math.min(Number(request.qs().limit) || 2000, 5000)

    // Fetch occurrences that have 2+ coordinates (polygons)
    const occurrenceIds = await db
      .from('occurrence_coordinates')
      .select('occurrence_id')
      .groupBy('occurrence_id')
      .havingRaw('count(*) >= 2')
      .limit(limit)

    if (occurrenceIds.length === 0) {
      return response.send({ data: [] })
    }

    const ids = occurrenceIds.map((r) => r.occurrence_id)

    const query = db
      .from('occurrences as o')
      .whereIn('o.id', ids)
      .select('o.id', 'o.protocol', 'o.status', 'o.neighborhood', 'o.category_id')

    if (status) query.where('o.status', status)

    const occurrences = await query

    // Fetch all coordinates for these occurrences
    const coords = await db
      .from('occurrence_coordinates')
      .whereIn('occurrence_id', occurrences.map((o) => o.id))
      .select('occurrence_id', 'latitude', 'longitude', 'position')
      .orderBy('occurrence_id')
      .orderBy('position')

    // Group coordinates by occurrence
    const coordMap = new Map<string, { lat: number; lng: number }[]>()
    for (const c of coords) {
      if (!coordMap.has(c.occurrence_id)) coordMap.set(c.occurrence_id, [])
      coordMap.get(c.occurrence_id)!.push({
        lat: Number(c.latitude),
        lng: Number(c.longitude),
      })
    }

    // Get category names
    const categoryIds = [...new Set(occurrences.map((o) => o.category_id).filter(Boolean))]
    const categories = categoryIds.length > 0
      ? await db.from('occurrence_categories').whereIn('id', categoryIds).select('id', 'name')
      : []
    const catMap = new Map(categories.map((c) => [c.id, c.name]))

    return response.send({
      data: occurrences
        .filter((o) => coordMap.has(o.id))
        .map((o) => ({
          id: o.id,
          protocol: o.protocol,
          status: o.status,
          neighborhood: o.neighborhood,
          category: catMap.get(o.category_id) ?? null,
          coordinates: coordMap.get(o.id)!,
        })),
    })
  }
}
