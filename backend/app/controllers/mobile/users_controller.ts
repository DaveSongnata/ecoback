import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import storageService from '#services/storage_service'
import { updateUserValidator } from '#validators/user'
import { serializeUser } from '#helpers/serializers'
import { apiError } from '#helpers/api_response'

const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp']

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export default class UsersController {
  async show({ params, response }: HttpContext) {
    const user = await User.query().where('id', params.id).preload('city').first()
    if (!user) {
      return response.status(404).send(apiError('User not found', 'E_NOT_FOUND'))
    }
    return response.send(serializeUser(user))
  }

  async update({ params, request, response }: HttpContext) {
    const body = await request.validateUsing(updateUserValidator)

    const user = await User.query().where('id', params.id).preload('city').first()
    if (!user) {
      return response.status(404).send(apiError('User not found', 'E_NOT_FOUND'))
    }

    const photo = request.file('profile_photo', {
      size: PHOTO_MAX_BYTES,
      extnames: ALLOWED_PHOTO_EXTS,
    })
    if (photo && !photo.isValid) {
      return response
        .status(400)
        .send(
          apiError(
            photo.errors[0]?.message ?? 'Invalid profile photo',
            'E_INVALID_FILE',
            'profile_photo'
          )
        )
    }

    // SPEC-DECISION: enforce email uniqueness here (vs. in validator) because we
    // need to ignore the user's own row.
    if (body.email && body.email !== user.email) {
      const taken = await User.query().where('email', body.email).whereNot('id', user.id).first()
      if (taken) {
        return response.status(422).send(apiError('Email already in use', 'E_EMAIL_TAKEN', 'email'))
      }
    }

    const oldPhotoUrl = user.profilePhotoUrl
    let newPhotoUrl: string | null = null

    if (photo) {
      const uploaded = await storageService.upload(photo, 'profile-photos')
      newPhotoUrl = uploaded.url
    }

    const passwordChanged = !!body.password

    try {
      await db.transaction(async (trx) => {
        user.useTransaction(trx)
        if (body.email) user.email = body.email
        if (body.birth_date) user.birthDate = body.birth_date
        if (body.city_id) user.cityId = body.city_id
        if (body.phone) user.phone = digitsOnly(body.phone)
        if (body.password) user.password = body.password
        if (newPhotoUrl) user.profilePhotoUrl = newPhotoUrl
        await user.save()

        if (passwordChanged) {
          await trx.from('auth_access_tokens').where('tokenable_id', user.id).delete()
        }
      })
    } catch (err) {
      // Roll back the just-uploaded photo if the DB transaction failed.
      if (newPhotoUrl) await storageService.delete(newPhotoUrl)
      throw err
    }

    if (newPhotoUrl && oldPhotoUrl) {
      await storageService.delete(oldPhotoUrl)
    }

    await user.load('city')
    return response.send(serializeUser(user))
  }
}
