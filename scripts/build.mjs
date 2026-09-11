#!/usr/bin/env node
/**
 * Cross-platform build for dsh-cherry-glass:
 *   1. regenerate src/client/glass-css.js from src/client/glass.css
 *   2. bundle the browser half with the repo's own tsdown
 *   3. copy the host half into lib/
 *
 * Usage: npm run build
 * Windows users may keep using scripts/build.ps1 (it can point at a harness
 * checkout for tsdown; this script prefers the repo's own node_modules).
 */

import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function run(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${scriptPath} exited with status ${result.status ?? 'null'}`)
  }
}

const tsdown = resolve(root, 'node_modules/tsdown/dist/run.mjs')
if (!existsSync(tsdown)) {
  throw new Error(
    'tsdown not found at node_modules/tsdown — run `npm install` in this repo, '
    + 'or use scripts/build.ps1 -Harness <deepseek-harness checkout>',
  )
}

console.log('generating glass-css.js...')
run(resolve(root, 'scripts/gen-css.mjs'))

console.log('bundling client...')
run(tsdown)

console.log('copying host half...')
copyFileSync(resolve(root, 'src/index.js'), resolve(root, 'lib/index.js'))

console.log('build complete: lib/client.js + lib/index.js')
