import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ensureSeedCategory, ensureSeedCity, makeAuthedUser } from '#tests/helpers/factories'

function tmpJpeg(name: string): string {
  const dir = join(tmpdir(), 'ecoback-test-fixtures')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, name)
  // Minimal JPEG header so file-type sniffing accepts it.
  const buf = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ])
  writeFileSync(path, buf)
  return path
}

test.group('POST /mobile/occurrences', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates an occurrence with 1 photo and 1 coordinate', async ({ client, assert }) => {
    const { user, tokenValue } = await makeAuthedUser()
    const city = await ensureSeedCity()
    const category = await ensureSeedCategory()

    const photoPath = tmpJpeg('one.jpg')

    const response = await client
      .post('/mobile/occurrences')
      .header('Authorization', `Bearer ${tokenValue}`)
      .file('photos', photoPath)
      .fields({
        city_id: city.id,
        category_id: category.id,
        cep: '01001-000',
        neighborhood: 'Centro',
        street: 'Rua A',
        address: '100',
        coordinates: JSON.stringify([{ lat: -23.55, lng: -46.63 }]),
      })

    response.assertStatus(201)
    assert.equal(response.body().photos.length, 1)
    assert.equal(response.body().coordinates.length, 1)
    assert.equal(response.body().city.id, city.id)

    // Implicitly verifies user_id was set:
    const list = await client
      .get('/mobile/occurrences')
      .header('Authorization', `Bearer ${tokenValue}`)
    list.assertStatus(200)
    assert.equal(list.body().meta.total, 1)
    assert.equal(list.body().data[0].id, response.body().id)
    assert.exists(user.id)
  })

  test('rejects 0 photos with 422', async ({ client }) => {
    const { tokenValue } = await makeAuthedUser()
    const city = await ensureSeedCity()
    const category = await ensureSeedCategory()

    const response = await client
      .post('/mobile/occurrences')
      .header('Authorization', `Bearer ${tokenValue}`)
      .fields({
        city_id: city.id,
        category_id: category.id,
        cep: '01001-000',
        neighborhood: 'Centro',
        street: 'Rua A',
        address: '100',
        coordinates: JSON.stringify([{ lat: -23.55, lng: -46.63 }]),
      })

    response.assertStatus(422)
  })

  test('rejects 4 photos with 422', async ({ client }) => {
    const { tokenValue } = await makeAuthedUser()
    const city = await ensureSeedCity()
    const category = await ensureSeedCategory()

    const req = client
      .post('/mobile/occurrences')
      .header('Authorization', `Bearer ${tokenValue}`)
      .fields({
        city_id: city.id,
        category_id: category.id,
        cep: '01001-000',
        neighborhood: 'Centro',
        street: 'Rua A',
        address: '100',
        coordinates: JSON.stringify([{ lat: -23.55, lng: -46.63 }]),
      })

    for (let i = 1; i <= 4; i++) {
      req.file('photos', tmpJpeg(`p${i}.jpg`))
    }

    const response = await req
    response.assertStatus(422)
  })
})

test.group('GET /mobile/occurrences/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('user A cannot see user B occurrence (404)', async ({ client }) => {
    const { tokenValue: tokenA } = await makeAuthedUser({ email: 'a@test.dev' })
    const { tokenValue: tokenB } = await makeAuthedUser({ email: 'b@test.dev' })

    const city = await ensureSeedCity()
    const category = await ensureSeedCategory()

    const create = await client
      .post('/mobile/occurrences')
      .header('Authorization', `Bearer ${tokenB}`)
      .file('photos', tmpJpeg('cross.jpg'))
      .fields({
        city_id: city.id,
        category_id: category.id,
        cep: '01001-000',
        neighborhood: 'Centro',
        street: 'Rua A',
        address: '100',
        coordinates: JSON.stringify([{ lat: -23.55, lng: -46.63 }]),
      })
    create.assertStatus(201)

    const response = await client
      .get(`/mobile/occurrences/${create.body().id}`)
      .header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(404)
  })
})
