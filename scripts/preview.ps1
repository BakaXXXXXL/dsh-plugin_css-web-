# DISABLED — do not use. This temporary preview script was the root cause of a
# long-running bug:
#
#   preview.ps1 -Apply embedded the cherry-glass stylesheet directly into
#   apps/web/dist/index.html. The injected <style data-plugin="dsh-cherry-glass">
#   tag matched the client plugin's idempotency guard, so the plugin's own
#   (newer) stylesheet was NEVER injected — the page kept showing whatever CSS
#   was baked into the HTML at injection time. Every plugin rebuild appeared to
#   do nothing, and stale sidebar backdrop-filter kept breaking the settings
#   modal (fixed-position overlay squeezed into the sidebar column).
#
# The plugin now updates through client-hmr hot reload (rebuild + copy lib into
# the profile copy), which needs no HTML injection at all. If the dist
# index.html ever contains cherry-glass style tags again, remove them:
#
#   powershell -ExecutionPolicy Bypass -File scripts/clean-dist.ps1
#
# See README.md "常见问题" for the full story.
param(
  [switch]$Apply,
  [switch]$Remove,
  [switch]$Check
)

Write-Host 'ERROR: preview.ps1 is disabled.' -ForegroundColor Red
Write-Host 'Injected preview styles are the root cause of the stale-theme / settings-modal bug.'
Write-Host 'Use the plugin build + client-hmr hot reload instead (see README.md).' -ForegroundColor Yellow
if ($Remove -or $Check) {
  Write-Host 'For cleanup use scripts/clean-dist.ps1.' -ForegroundColor Yellow
}
exit 1
