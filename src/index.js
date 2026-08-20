/**
 * dsh-cherry-glass host half. Pure UI plugin: the empty apply exists so the
 * row appears in the host Loader; the browser half ships via
 * exports["./client"], discovered through the package.json `dsh.client`
 * declaration.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const WEB_SERVER_KEYS = ['webServer', 'httpServer'];

/** Background artwork shipped with the theme (light/dark variants). */
const ARTWORK = new Map([
  ['bg-light.jpg', 'image/jpeg'],
  ['bg-dark.png', 'image/png'],
]);

/**
 * Host plugin body — serves the packaged background images to the browser
 * under /plugins/dsh-cherry-glass/* (the stylesheet references these same
 * URLs). Web server binding is not guaranteed at activation time (headless
 * profiles never mount it), so register lazily: try now, then on each service
 * binding event.
 */
export function apply(ctx) {
  let webRegistered = false;
  const registerWebSurface = () => {
    if (webRegistered) return;
    const webServer = ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]);
    if (webServer === undefined) return;
    webRegistered = true;
    const artDir = fileURLToPath(new URL('../assets/', import.meta.url));
    for (const [name, type] of ARTWORK) {
      ctx.effect(() => webServer.register({
        kind: 'exact',
        path: `/plugins/dsh-cherry-glass/${name}`,
        handler: async (req, res) => {
          try {
            const data = await readFile(join(artDir, name));
            res.writeHead(200, {
              'content-type': type,
              'cache-control': 'public, max-age=86400',
            });
            res.end(data);
          } catch (error) {
            ctx.logger.warn(`dsh-cherry-glass: artwork read failed for ${name}: ${String(error)}`);
            res.writeHead(404);
            res.end();
          }
        },
      }), `dsh-cherry-glass: artwork route ${name}`);
    }
  };
  registerWebSurface();
  ctx.on('internal/service', (name) => {
    if (WEB_SERVER_KEYS.includes(name)) registerWebSurface();
  });
}
