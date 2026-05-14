import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { authThrottle } from '#start/limiter'

const AuthController = () => import('#controllers/mobile/auth_controller')
const UsersController = () => import('#controllers/mobile/users_controller')
const CitiesController = () => import('#controllers/mobile/cities_controller')
const OccurrenceCategoriesController = () =>
  import('#controllers/mobile/occurrence_categories_controller')
const OccurrencesController = () => import('#controllers/mobile/occurrences_controller')

const WebAuthController = () => import('#controllers/web/auth_controller')
const StaffController = () => import('#controllers/web/staff_controller')
const WebOccurrencesController = () => import('#controllers/web/occurrences_controller')
const BiController = () => import('#controllers/web/bi_controller')
const ExportController = () => import('#controllers/web/export_controller')

router.get('/', () => ({ ok: true, service: 'ecoback' }))

// ── Mobile routes ──────────────────────────────────────────
router
  .group(() => {
    router.post('/signup', [AuthController, 'signup'])
    router.post('/login', [AuthController, 'login']).use(authThrottle)
    router.post('/forgot-password', [AuthController, 'forgotPassword']).use(authThrottle)

    router.get('/cities', [CitiesController, 'index'])
    router.get('/occurrence-categories', [OccurrenceCategoriesController, 'index'])

    router
      .group(() => {
        router.get('/users/:id', [UsersController, 'show']).use(middleware.ownerOnly())
        router.patch('/users/:id', [UsersController, 'update']).use(middleware.ownerOnly())

        router.post('/occurrences', [OccurrencesController, 'store'])
        router.get('/occurrences', [OccurrencesController, 'index'])
        router.get('/occurrences/:id', [OccurrencesController, 'show'])
      })
      .use(middleware.auth())
  })
  .prefix('/mobile')

// ── Web routes (prefeitura) ────────────────────────────────
router
  .group(() => {
    router.post('/login', [WebAuthController, 'login']).use(authThrottle)

    router
      .group(() => {
        router.post('/logout', [WebAuthController, 'logout'])
        router.get('/me', [WebAuthController, 'me'])

        // Lookups (any authenticated staff)
        router.get('/cities', [CitiesController, 'index'])
        router.get('/occurrence-categories', [OccurrenceCategoriesController, 'index'])

        // Staff management (requires staff:manage)
        router
          .group(() => {
            router.get('/staff', [StaffController, 'index'])
            router.post('/staff', [StaffController, 'store'])
            router.get('/staff/:id', [StaffController, 'show'])
            router.patch('/staff/:id', [StaffController, 'update'])
            router.delete('/staff/:id', [StaffController, 'destroy'])
            router.post('/staff/:id/restore', [StaffController, 'restore'])
            router.patch('/staff/:id/permissions', [StaffController, 'updatePermissions'])
          })
          .use(middleware.hasPermission({ permissions: ['staff:manage'] }))

        // Occurrences triage (requires occurrences:triage)
        router
          .group(() => {
            router.get('/occurrences', [WebOccurrencesController, 'index'])
            router.get('/occurrences/next', [WebOccurrencesController, 'nextForTriage'])
            router.get('/occurrences/:id', [WebOccurrencesController, 'show'])
            router.patch('/occurrences/:id/approve', [WebOccurrencesController, 'approve'])
            router.patch('/occurrences/:id/reject', [WebOccurrencesController, 'reject'])
            router.patch('/occurrences/:id/complete', [WebOccurrencesController, 'complete'])
          })
          .use(middleware.hasPermission({ permissions: ['occurrences:triage'] }))

        // Export (requires occurrences:export)
        router
          .group(() => {
            router.post('/export/pdf', [ExportController, 'pdf'])
          })
          .use(middleware.hasPermission({ permissions: ['occurrences:export'] }))

        // BI (requires bi:view)
        router
          .group(() => {
            router.get('/bi/overview', [BiController, 'overview'])
            router.get('/bi/by-category', [BiController, 'byCategory'])
            router.get('/bi/by-neighborhood', [BiController, 'byNeighborhood'])
            router.get('/bi/by-period', [BiController, 'byPeriod'])
            router.get('/bi/response-time', [BiController, 'responseTime'])
            router.get('/bi/heatmap', [BiController, 'heatmap'])
          })
          .use(middleware.hasPermission({ permissions: ['bi:view'] }))
      })
      .use(middleware.staffAuth())
  })
  .prefix('/web')
