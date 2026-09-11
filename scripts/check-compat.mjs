#!/usr/bin/env node
/**
 * Static compatibility check against the installed DeepSeek Harness.
 *
 * Fails when the theme overrides a --dsw-* design token that the installed
 * host no longer defines, or when a data-* seam / layout slot the stylesheet
 * relies on has disappeared.
 *
 * Usage: npm run check:compat
 *        DSH_HARNESS_ROOT=/path/to/node_modules/@deepseek-ai/dsh npm run check:compat
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TOKEN_RE = /--dsw-[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?/g

/** Seams the stylesheet keys on, and where they are expected to live. */
const REQUIRED_ATTRIBUTES = [
  'data-composer-card',
  'data-composer-seat',
  'data-conversation-scroll',
  'data-chat-flow-kind',
  'data-turn-process',
  'data-turn-tail',
  'data-ds-dark-theme',
  'data-rightbar-col',
  'data-sidebar-right-panel',
]
const REQUIRED_SLOTS = ['sidebar', 'main', 'rightbar']

function fail(message) {
  console.error(`check-compat: ${message}`)
  process.exit(1)
}

function findHarnessRoot() {
  if (process.env.DSH_HARNESS_ROOT) {
    return realpathSync(process.env.DSH_HARNESS_ROOT)
  }
  let bin
  try {
    bin = execFileSync(process.platform === 'win32' ? 'where' : 'which', ['dsh'], { encoding: 'utf8' })
      .split(/\r?\n/)[0]
      .trim()
  } catch {
    fail('dsh not found on PATH — install @deepseek-ai/dsh or set DSH_HARNESS_ROOT')
  }
  const real = realpathSync(bin)
  // Linux/macOS shims resolve to <package>/lib/bin.js; Windows shims may not.
  if (/[\\/]lib[\\/]bin\.js$/.test(real)) return dirname(dirname(real))
  return resolve(dirname(dirname(real)), 'lib/node_modules/@deepseek-ai/dsh')
}

function collectJs(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry !== 'node_modules') collectJs(full, out)
    } else if (entry.endsWith('.js')) {
      out.push(readFileSync(full, 'utf8'))
    }
  }
  return out
}

function versions(root) {
  const read = (path) => {
    try {
      return JSON.parse(readFileSync(path, 'utf8')).version
    } catch {
      return 'unknown'
    }
  }
  const moduleRoot = join(root, 'node_modules/@deepseek-ai')
  return {
    cli: read(join(root, 'package.json')),
    theme: read(join(moduleRoot, 'dsh-client-ui-theme/package.json')),
    webApp: read(join(moduleRoot, 'dsh-web-app/package.json')),
  }
}

const harnessRoot = findHarnessRoot()
const moduleRoot = join(harnessRoot, 'node_modules/@deepseek-ai')
if (!existsSync(join(moduleRoot, 'dsh-client-ui-theme/lib/client.js'))) {
  fail(`no installed harness at ${harnessRoot}`)
}

const hostTokens = new Set()
for (const source of collectJs(join(moduleRoot, 'dsh-client-ui-theme'))) {
  for (const match of source.matchAll(TOKEN_RE)) hostTokens.add(match[0])
}

const hostSources = []
for (const entry of readdirSync(moduleRoot)) {
  if (!entry.startsWith('dsh-client-ui-')) continue
  hostSources.push(...collectJs(join(moduleRoot, entry)))
}
const hostText = hostSources.join('\n')

const css = readFileSync(join(root, 'src/client/glass.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const pluginTokens = new Set()
for (const match of css.matchAll(TOKEN_RE)) pluginTokens.add(match[0])

const missingTokens = [...pluginTokens].filter((token) => !hostTokens.has(token)).sort()
const missingAttributes = REQUIRED_ATTRIBUTES.filter((attribute) => !hostText.includes(attribute))
const slots = new Set()
for (const source of collectJs(join(moduleRoot, 'dsh-client-ui-layout'))) {
  for (const match of source.matchAll(/renderSlot\("([^"]+)"/g)) slots.add(match[1])
}
const missingSlots = REQUIRED_SLOTS.filter((slot) => !slots.has(slot))

const { cli, theme, webApp } = versions(harnessRoot)
console.log(`harness: ${harnessRoot}`)
console.log(`versions: cli ${cli} | ui-theme ${theme} | web-app ${webApp}`)
console.log(`tokens: ${pluginTokens.size} overridden, ${hostTokens.size} defined by host`)
console.log(`seams: ${REQUIRED_ATTRIBUTES.length - missingAttributes.length}/${REQUIRED_ATTRIBUTES.length} attributes, `
  + `${REQUIRED_SLOTS.length - missingSlots.length}/${REQUIRED_SLOTS.length} slots`)

if (missingTokens.length > 0) {
  console.error(`\nmissing host tokens:\n  ${missingTokens.join('\n  ')}`)
  console.error('\nThe host renamed or removed these tokens; update src/client/glass.css.')
}
if (missingAttributes.length > 0) {
  console.error(`\nmissing data-* seams:\n  ${missingAttributes.join('\n  ')}`)
  console.error('\nThe host DOM seams changed; update the structural rules in src/client/glass.css.')
}
if (missingSlots.length > 0) {
  console.error(`\nmissing layout slots:\n  ${missingSlots.join('\n  ')}`)
  console.error('\nThe layout slot names changed; update the structural rules in src/client/glass.css.')
}
if (missingTokens.length + missingAttributes.length + missingSlots.length > 0) {
  process.exit(1)
}

console.log('compatible: all overridden tokens and structural seams are present.')
