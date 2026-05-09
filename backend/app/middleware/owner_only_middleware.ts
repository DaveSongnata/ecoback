import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Ensures the authenticated user matches the :id route param.
 * Pairs with auth middleware: auth must run first.
 */
export default class OwnerOnlyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    const paramId = ctx.params.id
    if (!user || !paramId || user.id !== paramId) {
      return ctx.response.status(403).send({
        errors: [{ message: 'Forbidden', code: 'E_FORBIDDEN' }],
      })
    }
    return next()
  }
}
