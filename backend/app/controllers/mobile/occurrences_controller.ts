import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Occurrence from '#models/occurrence'
import OccurrencePhoto from '#models/occurrence_photo'
import OccurrenceCoordinate from '#models/occurrence_coordinate'
import storageService from '#services/storage_service'
import { apiError } from '#helpers/api_response'
import { serializeOccurrence } from '#helpers/serializers'
import {
  coordinateValidator,
  createOccurrenceValidator,
  listOccurrencesValidator,
} from '#validators/occurrence'

const PHOTO_MAX_BYTES = 8 * 1024 * 1024
const MAX_PHOTOS = 3
const MIN_PHOTOS = 1
const ALLOWED_PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp']

export default class OccurrencesController {
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const body = await request.validateUsing(createOccurrenceValidator)

    const photos = request.files('photos', {
      size: PHOTO_MAX_BYTES,
      extnames: ALLOWED_PHOTO_EXTS,
    })

    if (!photos || photos.length < MIN_PHOTOS) {
      return response
        .status(422)
        .send(apiError('At least one photo is required', 'E_PHOTOS_REQUIRED', 'photos'))
    }
    if (photos.length > MAX_PHOTOS) {
      return response
        .status(422)
        .send(apiError(`At most ${MAX_PHOTOS} photos are allowed`, 'E_PHOTOS_TOO_MANY', 'photos'))
    }
    for (const file of photos) {
      if (!file.isValid) {
        return response
          .status(400)
          .send(
            apiError(file.errors[0]?.message ?? 'Invalid photo upload', 'E_INVALID_FILE', 'photos')
          )
      }
    }

    let coordinates: { lat: number; lng: number }[]
    const rawCoordinates = request.input('coordinates')
    try {
      const parsed =
        typeof rawCoordinates === 'string' ? JSON.parse(rawCoordinates) : rawCoordinates
      coordinates = await coordinateValidator.validate(parsed)
    } catch (err) {
      // Validation errors propagate normally; only catch JSON parse failures here.
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'E_VALIDATION_ERROR'
      ) {
        throw err
      }
      return response
        .status(400)
        .send(
          apiError(
            'coordinates must be a JSON array of {lat,lng}',
            'E_INVALID_COORDINATES',
            'coordinates'
          )
        )
    }

    // Upload all photos first (in parallel). If any fails, abort and clean up.
    const uploaded: { key: string; url: string }[] = []
    try {
      const results = await Promise.all(
        photos.map((file) => storageService.upload(file, 'occurrences'))
      )
      uploaded.push(...results)
    } catch (err) {
      await Promise.all(uploaded.map((u) => storageService.delete(u.key)))
      throw err
    }

    let occurrence: Occurrence
    try {
      occurrence = await db.transaction(async (trx) => {
        const created = await Occurrence.create(
          {
            userId: user.id,
            cityId: body.city_id,
            categoryId: body.category_id,
            cep: body.cep,
            neighborhood: body.neighborhood,
            street: body.street,
            address: body.address,
            observation: body.observation ?? null,
          },
          { client: trx }
        )

        await OccurrencePhoto.createMany(
          uploaded.map((u, idx) => ({
            occurrenceId: created.id,
            url: u.url,
            position: idx + 1,
          })),
          { client: trx }
        )

        await OccurrenceCoordinate.createMany(
          coordinates.map((c, idx) => ({
            occurrenceId: created.id,
            latitude: c.lat,
            longitude: c.lng,
            position: idx + 1,
          })),
          { client: trx }
        )

        return created
      })
    } catch (err) {
      await Promise.all(uploaded.map((u) => storageService.delete(u.key)))
      throw err
    }

    await occurrence.load((loader) => {
      loader.load('city').load('category').load('photos').load('coordinates').load('response')
    })

    return response.status(201).send(serializeOccurrence(occurrence))
  }

  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { page, per_page: perPageInput } = await request.validateUsing(listOccurrencesValidator, {
      data: request.qs(),
    })

    const pageNum = page ?? 1
    const perPage = perPageInput ?? 20

    const paginator = await Occurrence.query()
      .where('user_id', user.id)
      .preload('city')
      .preload('category')
      .preload('photos')
      .preload('coordinates')
      .preload('response')
      .orderBy('created_at', 'desc')
      .paginate(pageNum, perPage)

    return response.send({
      meta: {
        page: paginator.currentPage,
        per_page: paginator.perPage,
        total: paginator.total,
      },
      data: paginator.all().map(serializeOccurrence),
    })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const occurrence = await Occurrence.query()
      .where('id', params.id)
      .where('user_id', user.id) // SPEC: 404 instead of 403 when it isn't yours
      .preload('city')
      .preload('category')
      .preload('photos')
      .preload('coordinates')
      .preload('response')
      .first()

    if (!occurrence) {
      return response.status(404).send(apiError('Occurrence not found', 'E_NOT_FOUND'))
    }

    return response.send(serializeOccurrence(occurrence))
  }
}
