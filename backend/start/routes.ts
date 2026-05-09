import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { authThrottle } from '#start/limiter'

const AuthController = () => import('#controllers/mobile/auth_controller')
const UsersController = () => import('#controllers/mobile/users_controller')
const CitiesController = () => import('#controllers/mobile/cities_controller')
const OccurrenceCategoriesController = () =>
  import('#controllers/mobile/occurrence_categories_controller')
const OccurrencesController = () => import('#controllers/mobile/occurrences_controller')

router.get('/', () => ({ ok: true, service: 'ecoback' }))

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
