/**
 * dsh-cherry-glass host half. Pure UI plugin: the empty apply exists so the
 * row appears in the host Loader; the browser half ships via
 * exports["./client"], discovered through the package.json `dsh.client`
 * declaration.
 */

/** Host plugin body — no host-side behavior for this theme plugin. */
export function apply() {}
