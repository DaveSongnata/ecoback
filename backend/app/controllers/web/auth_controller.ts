import type { HttpContext } from '@adonisjs/core/http'
import Staff from '#models/staff'
import { apiError } from '#helpers/api_response'
import { staffLoginValidator } from '#validators/web/auth'

export default class WebAuthController {
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(staffLoginValidator)

    const staff = await Staff.query()
      .where('email', email)
      .whereNull('deleted_at')
      .first()

    if (!staff) {
      return response.status(401).send(apiError('Invalid credentials', 'E_INVALID_CREDENTIALS'))
    }

    if (!staff.isActive) {
      return response.status(403).send(apiError('Account is deactivated', 'E_ACCOUNT_INACTIVE'))
    }

    const isValid = await Staff.verifyCredentials(email, password)
    if (!isValid) {
      return response.status(401).send(apiError('Invalid credentials', 'E_INVALID_CREDENTIALS'))
    }

    const token = await Staff.accessTokens.create(staff)
    await staff.load('permissions')

    return response.send({
      token: token.value!.release(),
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        permissions: staff.permissionSlugs,
      },
    })
  }

  async logout({ auth, response }: HttpContext) {
    const staff = auth.use('web').getUserOrFail()
    const token = staff.currentAccessToken

    if (token) {
      await Staff.accessTokens.delete(staff, token.identifier)
    }

    return response.send({ ok: true })
  }

  async me({ auth, response }: HttpContext) {
    const staff = auth.use('web').getUserOrFail() as Staff
    await staff.load('permissions')

    return response.send({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      is_active: staff.isActive,
      permissions: staff.permissionSlugs,
      created_at: staff.createdAt?.toISO() ?? null,
    })
  }
}
