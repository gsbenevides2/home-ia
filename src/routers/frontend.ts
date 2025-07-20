import { Elysia } from 'elysia'
import fs from 'node:fs/promises'
import index from '../frontend/index.html'

const FRONTEND_BUILD_DIR = 'frontend-build'

const buildFolderExists = await fs
  .access(FRONTEND_BUILD_DIR)
  .then(() => true)
  .catch(() => false)

if (buildFolderExists) {
  await fs.rm(FRONTEND_BUILD_DIR, { recursive: true })
}
await Bun.build({
  entrypoints: [index.index],
  outdir: FRONTEND_BUILD_DIR,
  splitting: false,
  minify: true
})

const buildedFiles = await fs.readdir(FRONTEND_BUILD_DIR)

const router = new Elysia()

for (const file of buildedFiles) {
  if (file === 'index.html') {
    router.get('/', () => {
      return Bun.file(`${FRONTEND_BUILD_DIR}/index.html`)
    })
  } else {
    router.get(`/${file}`, () => {
      return Bun.file(`${FRONTEND_BUILD_DIR}/${file}`)
    })
  }
}

export default router
