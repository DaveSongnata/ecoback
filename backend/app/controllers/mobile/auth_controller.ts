import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import { randomBytes } from 'node:crypto'
import User from '#models/user'
import storageService from '#services/storage_service'
import { forgotPasswordValidator, loginValidator, signupValidator } from '#validators/auth'
import { serializeUserMinimal } from '#helpers/serializers'
import { apiError } from '#helpers/api_response'
import PasswordResetNotification from '#mails/password_reset_notification'

const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp']
const PASSWORD_LENGTH = 12

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function generateRandomPassword(length = PASSWORD_LENGTH): string {
  // SPEC-DECISION: alphanumerics + a small set of safe symbols. Avoids ambiguous
  // glyphs (O/0, l/1) and shell-special characters that get mangled in email clients.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

function tokenPayload(token: { value?: { release(): string }; expiresAt: Date | null }) {
  return {
    type: 'bearer',
    value: token.value!.release(),
    expires_at: token.expiresAt ? token.expiresAt.toISOString() : null,
  }
}

export default class AuthController {
  async signup({ request, response }: HttpContext) {
    const body = await request.validateUsing(signupValidator)

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

    let profilePhotoUrl: string | null = null
    if (photo) {
      const uploaded = await storageService.upload(photo, 'profile-photos')
      profilePhotoUrl = uploaded.url
    }

    const user = await User.create({
      email: body.email,
      birthDate: body.birth_date,
      cityId: body.city_id,
      phone: digitsOnly(body.phone),
      password: body.password,
      profilePhotoUrl,
    })

    const token = await User.accessTokens.create(user)

    return response.status(201).send({
      success: true,
      token: tokenPayload(token),
      user: serializeUserMinimal(user),
    })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user)
      return response.send({
        success: true,
        token: tokenPayload(token),
      })
    } catch {
      return response.status(401).send(apiError('Invalid credentials', 'E_INVALID_CREDENTIALS'))
    }
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const genericResponse = {
      success: true,
      message: 'If the email exists, a new password has been sent.',
    }

    const user = await User.findBy('email', email)
    if (!user) {
      return response.send(genericResponse)
    }

    const newPassword = generateRandomPassword()
    // The User model's withAuthFinder mixin hashes on save via @beforeSave when
    // password is dirty — set plaintext and let the hook handle it.
    user.password = newPassword

    // SPEC-DECISION: random-password reset (per spec). Wrap password update
    // and token revocation in a transaction so a partial failure can't leave
    // the account half-reset.
    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      await user.save()
      await trx.from('auth_access_tokens').where('tokenable_id', user.id).delete()
    })

    await mail.send(new PasswordResetNotification(user.email, newPassword))

    return response.send(genericResponse)
  }
}
