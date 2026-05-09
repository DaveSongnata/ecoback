import { DateTime } from 'luxon'
import City from '#models/city'
import OccurrenceCategory from '#models/occurrence_category'
import User from '#models/user'

export async function ensureSeedCity(name = 'São Paulo', ibgeCode = '3550308') {
  return await City.updateOrCreate({ ibgeCode }, { name, ibgeCode })
}

export async function ensureSeedCategory(slug = 'organic', name = 'Orgânico') {
  return await OccurrenceCategory.updateOrCreate({ slug }, { slug, name })
}

export async function makeUser(
  overrides: Partial<{
    email: string
    password: string
    cityId: string
    phone: string
    birthDate: DateTime
  }> = {}
) {
  const city = overrides.cityId ? null : await ensureSeedCity()
  const user = await User.create({
    email:
      overrides.email ?? `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.dev`,
    password: overrides.password ?? 'password123',
    cityId: overrides.cityId ?? city!.id,
    phone: overrides.phone ?? '11999999999',
    birthDate: overrides.birthDate ?? DateTime.fromISO('1990-01-01'),
  })
  return user
}

export async function makeAuthedUser(overrides: Parameters<typeof makeUser>[0] = {}) {
  const user = await makeUser(overrides)
  const token = await User.accessTokens.create(user)
  return { user, tokenValue: token.value!.release() }
}
