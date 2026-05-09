import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'

const useR2 = env.get('USE_CLOUDFLARE_R2')

const driveConfig = defineConfig({
  default: useR2 ? 'r2' : 'fs',

  services: {
    fs: services.fs({
      location: env.get('LOCAL_STORAGE_PATH', '/app/storage/uploads'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),
    r2: services.s3({
      credentials: {
        accessKeyId: env.get('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('R2_SECRET_ACCESS_KEY', ''),
      },
      region: 'auto',
      bucket: env.get('R2_BUCKET', ''),
      endpoint: env.get('R2_ACCOUNT_ID')
        ? `https://${env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`
        : '',
      visibility: 'public',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
