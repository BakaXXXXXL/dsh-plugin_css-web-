/**
 * Browser client bundle for dsh-cherry-glass, mirroring the DeepSeek Harness
 * `clientBundle` protocol (packages/client/tsdown.client.ts):
 *
 * - CJS closure-factory artifact: `window.__ModuleLoader__.load({ id,
 *   factory: (require) => ... })`.
 * - The stylesheet rides in as a generated plain-JS module
 *   (src/client/glass-css.js, see scripts/gen-css.mjs), so the bundle has no
 *   CSS pipeline and no externals at all — pure DOM code.
 *
 * Build without installing anything: scripts/build.ps1 invokes the DeepSeek
 * Harness checkout's own tsdown binary; the repo's `node_modules` junction
 * (created by the build script if missing) points at that checkout so the
 * config's `import 'tsdown'` resolves.
 */

import { defineConfig } from 'tsdown'

const PLUGIN_ID = 'dsh-cherry-glass'

export default defineConfig({
  name: `${PLUGIN_ID}/client`,
  entry: { client: 'src/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: [],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
