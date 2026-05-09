import type User from '#models/user'
import type Occurrence from '#models/occurrence'

export function serializeUser(user: User) {
  const city = user.city
  return {
    id: user.id,
    profile_photo_url: user.profilePhotoUrl,
    email: user.email,
    birth_date: user.birthDate ? user.birthDate.toISODate() : null,
    city: city
      ? {
          id: city.id,
          name: city.name,
          ibge_code: city.ibgeCode,
        }
      : null,
    phone: user.phone,
  }
}

export function serializeUserMinimal(user: User) {
  return {
    id: user.id,
    email: user.email,
    profile_photo_url: user.profilePhotoUrl,
  }
}

export function serializeOccurrence(occurrence: Occurrence) {
  const photos = (occurrence.photos ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((p) => ({ position: p.position, url: p.url }))

  const coordinates = (occurrence.coordinates ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      position: c.position,
      lat: Number(c.latitude),
      lng: Number(c.longitude),
    }))

  return {
    id: occurrence.id,
    city: occurrence.city
      ? {
          id: occurrence.city.id,
          name: occurrence.city.name,
          ibge_code: occurrence.city.ibgeCode,
        }
      : null,
    category: occurrence.category
      ? {
          id: occurrence.category.id,
          slug: occurrence.category.slug,
          name: occurrence.category.name,
        }
      : null,
    cep: occurrence.cep,
    neighborhood: occurrence.neighborhood,
    street: occurrence.street,
    address: occurrence.address,
    observation: occurrence.observation,
    photos,
    coordinates,
    created_at: occurrence.createdAt?.toISO() ?? null,
    updated_at: occurrence.updatedAt?.toISO() ?? null,
  }
}
