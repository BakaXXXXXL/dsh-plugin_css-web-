# Removes any injected dsh-cherry-glass <style> blocks from the built
# apps/web/dist/index.html (see preview.ps1 for why they must never exist).
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/clean-dist.ps1
param(
  [string]$Harness = 'C:\AAA\DeepseekHarness\deepseek-harness'
)

$ErrorActionPreference = 'Stop'
$index = Join-Path $Harness 'apps\web\dist\index.html'
if (-not (Test-Path $index)) { throw "dist index.html not found: $index" }
$html = Get-Content $index -Raw
$original = $html

$comment = '<!-- dsh-cherry-glass preview'
$ci = $html.IndexOf($comment)
if ($ci -ge 0) {
  $ce = $html.IndexOf('</style>', $ci)
  if ($ce -lt 0) { throw 'malformed preview block: no closing style tag' }
  $html = $html.Remove($ci, $ce - $ci + '</style>'.Length)
  Write-Host 'removed dist-preview block'
}

$marker = '<style data-plugin="dsh-cherry-glass">'
while ($true) {
  $mi = $html.IndexOf($marker)
  if ($mi -lt 0) { break }
  $me = $html.IndexOf('</style>', $mi)
  if ($me -lt 0) { throw 'malformed plain block' }
  $html = $html.Remove($mi, $me - $mi + '</style>'.Length)
  Write-Host 'removed plain style block'
}

if ($html -eq $original) {
  Write-Host 'clean: no cherry-glass style blocks present'
  exit 0
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($index, $html, $utf8NoBom)
Write-Host 'index.html cleaned (web rebuild would do the same)'
