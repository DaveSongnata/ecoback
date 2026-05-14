import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type Staff from '#models/staff'

export default class HasPermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { permissions: string[] }) {
    const staff = ctx.auth.use('web').getUserOrFail() as Staff

    const hasAny = options.permissions.some((p) => staff.hasPermission(p))

    if (!hasAny) {
      return ctx.response.status(403).send({
        errors: [{ message: 'Insufficient permissions', code: 'E_FORBIDDEN' }],
      })
    }

    return next()
  }
}
