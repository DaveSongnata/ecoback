/*
 * Patch para incompatibilidade entre @adonisjs/core@7.x (que removeu `cuid` de
 * `@adonisjs/core/helpers`) e @adonisjs/mail@9.x (que ainda importa dela).
 * Roda no postinstall — idempotente.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const mailDir = join(root, 'node_modules/@adonisjs/mail/build')

if (!existsSync(mailDir)) {
  // Mail não está instalado — nada a fazer.
  process.exit(0)
}

// Shim simples e suficiente: ID curto, único o bastante para Content-IDs de e-mail.
const SHIM =
  'const cuid = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);'
const NEEDLE = 'import { cuid } from "@adonisjs/core/helpers";'

const candidates = readdirSync(mailDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => join(mailDir, f))

let patched = 0
for (const path of candidates) {
  let content = readFileSync(path, 'utf8')
  if (content.includes(NEEDLE)) {
    content = content.replace(NEEDLE, SHIM)
    writeFileSync(path, content)
    patched++
    console.log(`[patch-deps] ${path.replace(root + '/', '')}`)
  }
}

if (patched === 0) {
  console.log('[patch-deps] nada a patchar (já corrigido ou versão diferente)')
}
