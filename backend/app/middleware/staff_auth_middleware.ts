import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class StaffAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.use('web').authenticate()

    const staff = ctx.auth.use('web').getUserOrFail()

    if (!staff.isActive || staff.deletedAt) {
      return ctx.response.status(403).send({
        errors: [{ message: 'Account is deactivated', code: 'E_ACCOUNT_INACTIVE' }],
      })
    }

    await staff.load('permissions')

    return next()
  }
}
