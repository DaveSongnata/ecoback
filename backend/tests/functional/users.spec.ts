import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { makeAuthedUser } from '#tests/helpers/factories'

test.group('PATCH /mobile/users/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('owner can fetch self', async ({ client, assert }) => {
    const { user, tokenValue } = await makeAuthedUser({ email: 'me@test.dev' })

    const response = await client
      .get(`/mobile/users/${user.id}`)
      .header('Authorization', `Bearer ${tokenValue}`)

    response.assertStatus(200)
    assert.equal(response.body().email, 'me@test.dev')
    assert.exists(response.body().city)
  })

  test('non-owner cannot fetch another user (403)', async ({ client }) => {
    const { tokenValue } = await makeAuthedUser({ email: 'a@test.dev' })
    const { user: other } = await makeAuthedUser({ email: 'b@test.dev' })

    const response = await client
      .get(`/mobile/users/${other.id}`)
      .header('Authorization', `Bearer ${tokenValue}`)

    response.assertStatus(403)
  })

  test('changing password invalidates existing tokens', async ({ client, assert }) => {
    const { user, tokenValue } = await makeAuthedUser({ email: 'pw@test.dev' })
    const before = await User.accessTokens.create(user)
    assert.exists(before.value)

    const response = await client
      .patch(`/mobile/users/${user.id}`)
      .header('Authorization', `Bearer ${tokenValue}`)
      .form({ password: 'newpassword123' })

    response.assertStatus(200)

    const remaining = await db
      .from('auth_access_tokens')
      .where('tokenable_id', user.id)
      .count('* as c')
    assert.equal(Number(remaining[0].c), 0)
  })
})
