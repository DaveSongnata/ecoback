import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

/**
 * Generates ~1M mock occurrences spread across Manaus.
 *
 * REVERSIBLE: run `DELETE FROM occurrences WHERE observation = '__MOCK_DATA__';`
 * or use the companion SQL: `SELECT mock_cleanup();`
 *
 * The marker `__MOCK_DATA__` in the observation field identifies all mock rows.
 */
export default class MockOccurrencesSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    const TOTAL = 1_000_000
    const BATCH_SIZE = 10_000
    const MOCK_MARKER = '__MOCK_DATA__'

    // Check if mock data already exists
    const existing = await db
      .from('occurrences')
      .where('observation', MOCK_MARKER)
      .count('* as total')
      .first()
    if (Number(existing?.total) > 0) {
      console.log(`Mock data already exists (${existing?.total} rows). Skipping.`)
      console.log(`To remove: DELETE FROM occurrences WHERE observation = '${MOCK_MARKER}';`)
      return
    }

    // Get reference IDs
    const cities = await db.from('cities').select('id')
    const categories = await db.from('occurrence_categories').select('id')
    const users = await db.from('users').select('id')

    if (!cities.length || !categories.length || !users.length) {
      console.log('Need at least 1 city, 1 category, and 1 user. Skipping mock seeder.')
      return
    }

    const cityIds = cities.map((c) => c.id)
    const categoryIds = categories.map((c) => c.id)
    const userIds = users.map((u) => u.id)

    // Manaus bounding box
    const LAT_MIN = -3.16
    const LAT_MAX = -2.95
    const LNG_MIN = -60.10
    const LNG_MAX = -59.82

    const statuses = ['em_analise', 'aprovada', 'cancelada', 'concluida']
    const neighborhoods = [
      'Centro', 'Cidade Nova', 'Flores', 'Parque 10', 'Adrianópolis',
      'Dom Pedro', 'Aleixo', 'Cachoeirinha', 'São Jorge', 'Compensa',
      'Santo Antônio', 'Praça 14', 'Japiim', 'Coroado', 'Zumbi',
      'Armando Mendes', 'Tancredo Neves', 'Jorge Teixeira', 'Nova Cidade',
      'Lago Azul', 'Novo Israel', 'Monte das Oliveiras', 'Santa Etelvina',
      'Colônia Terra Nova', 'Tarumã', 'Ponta Negra', 'Lírio do Vale',
      'Planalto', 'Redenção', 'Betânia',
    ]
    const streets = [
      'Av. Eduardo Ribeiro', 'Av. Djalma Batista', 'Av. Constantino Nery',
      'Av. Brasil', 'Av. Max Teixeira', 'Av. Torquato Tapajós',
      'Rua Ramos Ferreira', 'Rua 10 de Julho', 'Rua José Paranaguá',
      'Rua Monsenhor Coutinho', 'Av. Autaz Mirim', 'Av. Grande Circular',
      'Av. das Torres', 'Av. Margarita', 'Rua Salvador',
    ]

    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    function randomProtocol(dateOffset: number): string {
      const d = new Date(Date.now() - dateOffset)
      const yy = String(d.getFullYear()).slice(2)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      let rand = ''
      for (let i = 0; i < 5; i++) rand += chars[Math.floor(Math.random() * chars.length)]
      return `EC${yy}${mm}-${rand}`
    }

    console.log(`Inserting ${TOTAL.toLocaleString()} mock occurrences in batches of ${BATCH_SIZE.toLocaleString()}...`)
    const startTime = Date.now()

    for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
      const size = Math.min(BATCH_SIZE, TOTAL - batch)

      // Use raw SQL for maximum insert speed
      const values: string[] = []
      const params: any[] = []
      let paramIdx = 1

      for (let i = 0; i < size; i++) {
        const lat = LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN)
        const lng = LNG_MIN + Math.random() * (LNG_MAX - LNG_MIN)
        const daysAgo = Math.floor(Math.random() * 365) // last year
        const dateOffset = daysAgo * 86400000
        const createdAt = new Date(Date.now() - dateOffset).toISOString()
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const cityId = cityIds[Math.floor(Math.random() * cityIds.length)]
        const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)]
        const userId = userIds[Math.floor(Math.random() * userIds.length)]
        const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
        const street = streets[Math.floor(Math.random() * streets.length)]
        const protocol = randomProtocol(dateOffset)
        const cep = `690${String(Math.floor(Math.random() * 100)).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

        values.push(`(
          gen_random_uuid(), $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
          $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
          $${paramIdx++}, $${paramIdx++}, $${paramIdx++}::occurrence_status,
          $${paramIdx++}::timestamptz, $${paramIdx++}::timestamptz
        )`)
        params.push(
          userId, cityId, categoryId,
          cep, neighborhood, street, String(Math.floor(Math.random() * 9000) + 100),
          MOCK_MARKER, protocol, status,
          createdAt, createdAt
        )
      }

      await db.rawQuery(`
        INSERT INTO occurrences (id, user_id, city_id, category_id, cep, neighborhood, street, address, observation, protocol, status, created_at, updated_at)
        VALUES ${values.join(',')}
      `, params)

      // Also insert one coordinate per occurrence (for heatmap)
      await db.rawQuery(`
        INSERT INTO occurrence_coordinates (id, occurrence_id, latitude, longitude, position, created_at)
        SELECT gen_random_uuid(), o.id,
          ${LAT_MIN} + random() * ${LAT_MAX - LAT_MIN},
          ${LNG_MIN} + random() * ${LNG_MAX - LNG_MIN},
          1, o.created_at
        FROM occurrences o
        WHERE o.observation = '${MOCK_MARKER}'
        AND NOT EXISTS (
          SELECT 1 FROM occurrence_coordinates c WHERE c.occurrence_id = o.id
        )
      `)

      const pct = Math.round(((batch + size) / TOTAL) * 100)
      process.stdout.write(`\r  ${pct}% (${(batch + size).toLocaleString()} / ${TOTAL.toLocaleString()})`)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n  Done in ${elapsed}s`)
    console.log(`  To remove: DELETE FROM occurrence_coordinates WHERE occurrence_id IN (SELECT id FROM occurrences WHERE observation = '${MOCK_MARKER}'); DELETE FROM occurrences WHERE observation = '${MOCK_MARKER}';`)
  }
}
