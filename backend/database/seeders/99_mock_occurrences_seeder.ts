import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

/**
 * Mock occurrences across Manaus urban zones with realistic hotspots.
 *
 * REVERSIBLE:
 *   DELETE FROM occurrence_coordinates WHERE occurrence_id IN
 *     (SELECT id FROM occurrences WHERE observation = '__MOCK_DATA__');
 *   DELETE FROM occurrences WHERE observation = '__MOCK_DATA__';
 */
export default class MockOccurrencesSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    const TOTAL = 30_000
    const BATCH = 5_000
    const MARKER = '__MOCK_DATA__'

    const existing = await db
      .from('occurrences')
      .where('observation', MARKER)
      .count('* as total')
      .first()
    if (Number(existing?.total) > 0) {
      console.log(`Mock data already exists (${existing?.total} rows). Skipping.`)
      return
    }

    const cities = (await db.from('cities').select('id')).map((r) => r.id)
    const categories = (await db.from('occurrence_categories').select('id')).map((r) => r.id)
    const users = (await db.from('users').select('id')).map((r) => r.id)

    if (!cities.length || !categories.length || !users.length) {
      console.log('Need at least 1 city, 1 category, and 1 user. Skipping.')
      return
    }

    // ── Manaus urban zones (polygons that avoid rivers and forest) ──────
    // Each zone: { name, center, radius, weight }
    // weight = relative density (higher = more points concentrated here)
    const zones = [
      // Centro-Sul (mais denso — comercial, residencial antigo)
      { name: 'Centro', lat: -3.1190, lng: -60.0217, radius: 0.012, weight: 3.0 },
      { name: 'Praça 14', lat: -3.1240, lng: -60.0130, radius: 0.008, weight: 1.5 },
      { name: 'Cachoeirinha', lat: -3.1120, lng: -60.0280, radius: 0.008, weight: 1.2 },
      { name: 'São Jorge', lat: -3.1060, lng: -60.0380, radius: 0.007, weight: 1.0 },
      { name: 'Compensa', lat: -3.1050, lng: -60.0500, radius: 0.010, weight: 1.8 },
      { name: 'Santo Antônio', lat: -3.1150, lng: -60.0420, radius: 0.006, weight: 0.8 },

      // Centro-Oeste
      { name: 'Aleixo', lat: -3.0980, lng: -60.0180, radius: 0.008, weight: 0.9 },
      { name: 'Adrianópolis', lat: -3.1030, lng: -60.0220, radius: 0.006, weight: 0.7 },
      { name: 'Flores', lat: -3.0870, lng: -60.0250, radius: 0.010, weight: 1.3 },
      { name: 'Parque 10', lat: -3.0950, lng: -60.0300, radius: 0.008, weight: 1.4 },
      { name: 'Dom Pedro', lat: -3.0850, lng: -60.0400, radius: 0.009, weight: 1.1 },

      // Zona Norte (populosa, periférica)
      { name: 'Cidade Nova', lat: -3.0530, lng: -60.0150, radius: 0.015, weight: 2.5 },
      { name: 'Novo Israel', lat: -3.0400, lng: -60.0200, radius: 0.010, weight: 1.5 },
      { name: 'Monte Oliveiras', lat: -3.0320, lng: -60.0300, radius: 0.012, weight: 1.3 },
      { name: 'Lago Azul', lat: -3.0450, lng: -60.0350, radius: 0.008, weight: 1.0 },
      { name: 'Col. Terra Nova', lat: -3.0250, lng: -60.0400, radius: 0.012, weight: 1.6 },
      { name: 'Santa Etelvina', lat: -3.0180, lng: -60.0250, radius: 0.010, weight: 1.2 },

      // Zona Leste (muito populosa)
      { name: 'Armando Mendes', lat: -3.0930, lng: -59.9460, radius: 0.010, weight: 2.0 },
      { name: 'Zumbi', lat: -3.0870, lng: -59.9520, radius: 0.008, weight: 1.5 },
      { name: 'Coroado', lat: -3.0830, lng: -59.9650, radius: 0.010, weight: 1.8 },
      { name: 'Tancredo Neves', lat: -3.0780, lng: -59.9400, radius: 0.012, weight: 2.2 },
      { name: 'Jorge Teixeira', lat: -3.0700, lng: -59.9350, radius: 0.015, weight: 2.8 },
      { name: 'Nova Cidade', lat: -3.0600, lng: -59.9500, radius: 0.010, weight: 1.4 },

      // Zona Sul
      { name: 'Japiim', lat: -3.1280, lng: -60.0050, radius: 0.008, weight: 1.3 },
      { name: 'Betânia', lat: -3.1200, lng: -59.9950, radius: 0.006, weight: 0.8 },
      { name: 'Redenção', lat: -3.1150, lng: -59.9900, radius: 0.007, weight: 0.9 },
      { name: 'Planalto', lat: -3.1100, lng: -59.9800, radius: 0.008, weight: 1.0 },

      // Zona Oeste
      { name: 'Tarumã', lat: -3.0700, lng: -60.0600, radius: 0.010, weight: 0.8 },
      { name: 'Ponta Negra', lat: -3.0580, lng: -60.0750, radius: 0.012, weight: 0.7 },
      { name: 'Lírio do Vale', lat: -3.0700, lng: -60.0500, radius: 0.008, weight: 0.6 },

      // Hotspots (locais com picos de lixo — mercados, feiras, terminais)
      { name: 'Feira Manaus Moderna', lat: -3.1380, lng: -60.0230, radius: 0.003, weight: 4.0 },
      { name: 'Terminal T1', lat: -3.0620, lng: -60.0100, radius: 0.003, weight: 3.5 },
      { name: 'Terminal T3', lat: -3.0960, lng: -59.9580, radius: 0.003, weight: 3.0 },
      { name: 'Av Djalma Batista', lat: -3.0900, lng: -60.0320, radius: 0.002, weight: 2.5 },
      { name: 'Av Torquato Tapajós', lat: -3.0500, lng: -60.0200, radius: 0.003, weight: 2.8 },
    ]

    // Calculate total weight for distribution
    const totalWeight = zones.reduce((s, z) => s + z.weight, 0)

    const statuses = ['em_analise', 'aprovada', 'cancelada', 'concluida']
    const streets = [
      'Av. Eduardo Ribeiro', 'Av. Djalma Batista', 'Av. Constantino Nery',
      'Av. Brasil', 'Av. Max Teixeira', 'Av. Torquato Tapajós',
      'Rua Ramos Ferreira', 'Rua 10 de Julho', 'Rua José Paranaguá',
      'Rua Monsenhor Coutinho', 'Av. Autaz Mirim', 'Av. Grande Circular',
      'Av. das Torres', 'Av. Margarita', 'Rua Salvador',
    ]

    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
    const esc = (s: string) => s.replace(/'/g, "''")
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

    // Gaussian-ish random (sum of 3 randoms → bell curve)
    function gaussRand() {
      return (Math.random() + Math.random() + Math.random()) / 3
    }

    // Generate point within a zone using gaussian distribution (clustered center)
    function pointInZone(zone: typeof zones[0]): { lat: number; lng: number } {
      const angle = Math.random() * Math.PI * 2
      const dist = gaussRand() * zone.radius
      return {
        lat: zone.lat + Math.cos(angle) * dist,
        lng: zone.lng + Math.sin(angle) * dist,
      }
    }

    // Pick zone weighted by density
    function pickZone(): typeof zones[0] {
      let r = Math.random() * totalWeight
      for (const z of zones) {
        r -= z.weight
        if (r <= 0) return z
      }
      return zones[0]
    }

    function proto(d: Date, idx: number) {
      const yy = String(d.getFullYear()).slice(2)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      let r = ''
      for (let i = 0; i < 7; i++) r += chars[Math.floor(Math.random() * chars.length)]
      return `MC${yy}${mm}-${r}${String(idx % 100).padStart(2, '0')}`
    }

    console.log(`Inserting ${TOTAL.toLocaleString()} mock occurrences across ${zones.length} urban zones...`)
    const t0 = Date.now()

    for (let offset = 0; offset < TOTAL; offset += BATCH) {
      const size = Math.min(BATCH, TOTAL - offset)
      const occRows: string[] = []
      const coordRows: string[] = []

      for (let i = 0; i < size; i++) {
        const zone = pickZone()
        const { lat, lng } = pointInZone(zone)
        const daysAgo = Math.floor(Math.random() * 365)
        const d = new Date(Date.now() - daysAgo * 86400000)
        const ts = d.toISOString()
        const occId = `gen_random_uuid()`

        // Use a CTE-friendly approach: generate UUID in WITH clause
        const uid = `'${crypto.randomUUID()}'`

        occRows.push(`(
          ${uid}::uuid,
          '${pick(users)}', '${pick(cities)}', '${pick(categories)}',
          '690${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}',
          '${esc(zone.name)}',
          '${esc(pick(streets))}',
          '${Math.floor(Math.random() * 9000) + 100}',
          '${MARKER}',
          '${proto(d, offset + i)}',
          '${pick(statuses)}'::occurrence_status,
          '${ts}'::timestamptz,
          '${ts}'::timestamptz
        )`)

        coordRows.push(`(
          gen_random_uuid(),
          ${uid}::uuid,
          ${lat.toFixed(7)},
          ${lng.toFixed(7)},
          1,
          '${ts}'::timestamptz
        )`)
      }

      await db.rawQuery(`
        INSERT INTO occurrences
          (id, user_id, city_id, category_id, cep, neighborhood, street, address, observation, protocol, status, created_at, updated_at)
        VALUES ${occRows.join(',')}
        ON CONFLICT (protocol) DO NOTHING
      `)

      await db.rawQuery(`
        INSERT INTO occurrence_coordinates
          (id, occurrence_id, latitude, longitude, position, created_at)
        VALUES ${coordRows.join(',')}
        ON CONFLICT DO NOTHING
      `)

      const pct = Math.round(((offset + size) / TOTAL) * 100)
      process.stdout.write(`\r  ${pct}% (${(offset + size).toLocaleString()} / ${TOTAL.toLocaleString()})`)
    }

    console.log(`\n  Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
    console.log(`  To remove: DELETE FROM occurrence_coordinates WHERE occurrence_id IN (SELECT id FROM occurrences WHERE observation = '${MARKER}'); DELETE FROM occurrences WHERE observation = '${MARKER}';`)
  }
}
