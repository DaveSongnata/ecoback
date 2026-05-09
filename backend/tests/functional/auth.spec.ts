import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { ensureSeedCity, makeUser } from '#tests/helpers/factories'

test.group('POST /mobile/signup', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates a user and returns a token', async ({ client, assert }) => {
    const city = await ensureSeedCity()

    const response = await client.post('/mobile/signup').form({
      email: 'newuser@test.dev',
      birth_date: '1995-05-10',
      city_id: city.id,
      phone: '11987654321',
      password: 'password123',
    })

    response.assertStatus(201)
    response.assertBodyContains({ success: true })
    assert.exists(response.body().token?.value)
    assert.equal(response.body().user.email, 'newuser@test.dev')

    const user = await User.findBy('email', 'newuser@test.dev')
    assert.exists(user)
  })

  test('returns 400 for duplicate email', async ({ client }) => {
    const city = await ensureSeedCity()
    await makeUser({ email: 'taken@test.dev', cityId: city.id })

    const response = await client.post('/mobile/signup').form({
      email: 'taken@test.dev',
      birth_date: '1995-05-10',
      city_id: city.id,
      phone: '11987654321',
      password: 'password123',
    })

    response.assertStatus(400)
    response.assertBodyContains({ errors: [{ field: 'email' }] })
  })
})

test.group('POST /mobile/login', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns token on valid credentials', async ({ client, assert }) => {
    await makeUser({ email: 'login@test.dev', password: 'password123' })

    const response = await client.post('/mobile/login').json({
      email: 'login@test.dev',
      password: 'password123',
    })

    response.assertStatus(200)
    assert.exists(response.body().token?.value)
  })

  test('returns 401 on bad credentials', async ({ client }) => {
    await makeUser({ email: 'login@test.dev', password: 'password123' })

    const response = await client.post('/mobile/login').json({
      email: 'login@test.dev',
      password: 'wrong-password',
    })

    response.assertStatus(401)
    response.assertBodyContains({ errors: [{ message: 'Invalid credentials' }] })
  })
})

test.group('POST /mobile/forgot-password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns generic 200 for unknown email and sends no mail', async ({ client, assert }) => {
    const { mails } = mail.fake()

    const response = await client.post('/mobile/forgot-password').json({
      email: 'nobody@test.dev',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.equal(mails.sent().length, 0)
    mail.restore()
  })

  test('sends mail and revokes existing tokens for known email', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const user = await makeUser({ email: 'reset@test.dev' })
    const token = await User.accessTokens.create(user)
    assert.exists(token.value)

    const response = await client.post('/mobile/forgot-password').json({
      email: 'reset@test.dev',
    })

    response.assertStatus(200)
    assert.equal(mails.sent().length, 1)

    const remaining = await db
      .from('auth_access_tokens')
      .where('tokenable_id', user.id)
      .count('* as c')
    assert.equal(Number(remaining[0].c), 0)
    mail.restore()
  })
})
