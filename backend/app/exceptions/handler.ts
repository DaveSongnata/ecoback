import app from '@adonisjs/core/services/app'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as vineErrors } from '@vinejs/vine'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

interface ApiError {
  message: string
  field?: string
  code?: string
}

interface VineFieldError {
  message: string
  field: string
  rule: string
  meta?: Record<string, unknown>
}

/**
 * SPEC-DECISION: every error path returns the spec's
 * { errors: [{ message, field?, code? }] } envelope.
 */
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      const errors: ApiError[] = (error.messages as VineFieldError[]).map((m) => ({
        message: m.message,
        field: m.field,
        code: m.rule,
      }))
      return ctx.response.status(400).send({ errors })
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return ctx.response
        .status(401)
        .send({ errors: [{ message: 'Unauthorized', code: 'E_UNAUTHORIZED_ACCESS' }] })
    }

    if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
      return ctx.response
        .status(429)
        .send({ errors: [{ message: 'Too many requests', code: 'E_TOO_MANY_REQUESTS' }] })
    }

    if (error && typeof error === 'object' && 'status' in error && 'code' in error) {
      const e = error as { status: number; code: string; message: string }
      if (e.status >= 400 && e.status < 500) {
        return ctx.response.status(e.status).send({
          errors: [{ message: e.message ?? 'Request failed', code: e.code }],
        })
      }
    }

    if (!app.inProduction) {
      return super.handle(error, ctx)
    }

    return ctx.response.status(500).send({
      errors: [{ message: 'Internal server error', code: 'E_INTERNAL_ERROR' }],
    })
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
