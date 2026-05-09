import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import drive from '@adonisjs/drive/services/main'
import env from '#start/env'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

export interface UploadedFileInfo {
  key: string
  url: string
}

/**
 * SPEC-DECISION: single service that hides the local-vs-R2 split.
 * The disk is decided once via USE_CLOUDFLARE_R2; controllers never touch the env.
 */
export class StorageService {
  private get useR2(): boolean {
    return env.get('USE_CLOUDFLARE_R2')
  }

  private get diskName(): 'fs' | 'r2' {
    return this.useR2 ? 'r2' : 'fs'
  }

  private buildKey(folder: string, originalName: string | null | undefined): string {
    const ext = (originalName ? extname(originalName) : '').toLowerCase().replace(/[^.\w]/g, '')
    const safeFolder = folder.replace(/^\/+|\/+$/g, '')
    return `${safeFolder}/${randomUUID()}${ext}`
  }

  private publicUrlFor(key: string): string {
    if (this.useR2) {
      const base = env.get('R2_PUBLIC_URL', '').replace(/\/+$/, '')
      return `${base}/${key}`
    }
    const base = env.get('LOCAL_STORAGE_PUBLIC_URL', '').replace(/\/+$/, '')
    return `${base}/${key}`
  }

  async upload(file: MultipartFile, folder: string): Promise<UploadedFileInfo> {
    if (!file.tmpPath) {
      throw new Error('Uploaded file has no tmpPath; ensure bodyparser autoProcess is enabled')
    }
    const key = this.buildKey(folder, file.clientName)
    await drive.use(this.diskName).moveFromFs(file.tmpPath, key, {
      visibility: 'public',
      contentType: file.headers['content-type'] as string | undefined,
    })
    return { key, url: this.publicUrlFor(key) }
  }

  async delete(keyOrUrl: string): Promise<void> {
    const key = this.urlToKey(keyOrUrl)
    if (!key) return
    try {
      await drive.use(this.diskName).delete(key)
    } catch {
      // SPEC-DECISION: deletes are best-effort — losing track of an old file should
      // not break the request that triggered the deletion.
    }
  }

  /**
   * Reverses the public URL back to a storage key. Accepts either a raw key
   * or a fully-qualified URL stored in the DB.
   */
  urlToKey(keyOrUrl: string): string | null {
    if (!keyOrUrl) return null
    if (!keyOrUrl.startsWith('http://') && !keyOrUrl.startsWith('https://')) {
      return keyOrUrl.replace(/^\/+/, '')
    }
    const base = this.useR2 ? env.get('R2_PUBLIC_URL', '') : env.get('LOCAL_STORAGE_PUBLIC_URL', '')
    const trimmedBase = base.replace(/\/+$/, '')
    if (trimmedBase && keyOrUrl.startsWith(trimmedBase)) {
      return keyOrUrl.slice(trimmedBase.length).replace(/^\/+/, '')
    }
    try {
      const u = new URL(keyOrUrl)
      return u.pathname.replace(/^\/uploads\/?/, '').replace(/^\/+/, '')
    } catch {
      return null
    }
  }
}

const storageService = new StorageService()
export default storageService
