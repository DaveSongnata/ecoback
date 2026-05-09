import limiter from '@adonisjs/limiter/services/main'

/**
 * 5 attempts per 5 minutes per IP, on the auth-sensitive endpoints.
 */
export const authThrottle = limiter.define('auth', (ctx) => {
  return limiter.allowRequests(5).every('5 mins').usingKey(`auth_${ctx.request.ip()}`)
})
