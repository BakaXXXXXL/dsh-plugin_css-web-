/**
 * dsh-cherry-glass browser half: inject one global stylesheet (the adapted
 * Cherry Studio V2 glass theme) and remove it when the plugin fiber unloads.
 * No services are required; the bundle exports only `apply`.
 */

import cssText from './glass-css.js'

const PLUGIN_ID = 'dsh-cherry-glass'
const STYLE_SELECTOR = 'style[data-plugin="dsh-cherry-glass"]'

/**
 * Client plugin body: append the theme stylesheet to <head>.
 * @param ctx - client root context (used only for its effect lifetime).
 */
export function apply(ctx) {
  if (typeof document === 'undefined') return
  if (document.querySelector(STYLE_SELECTOR) !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = PLUGIN_ID
  tag.dataset.theme = 'cherry-glass'
  tag.textContent = cssText
  document.head.appendChild(tag)
  // Unload contract: dispose removes the injected style with the fiber.
  ctx.effect(() => () => { tag.remove() }, `${PLUGIN_ID}: theme stylesheet`)
}
