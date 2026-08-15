# Builds dsh-cherry-glass using the DeepSeek Harness checkout's own tsdown
# (no `pnpm install` needed). Steps: generate the CSS module, link the
# harness node_modules junction (so `import 'tsdown'` resolves), bundle the
# client half, copy the host half into lib/.
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build.ps1
#        [-Harness C:\path\to\deepseek-harness]

param(
  [string]$Harness = 'C:\AAA\DeepseekHarness\deepseek-harness'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$nodeModules = Join-Path $root 'node_modules'

if (-not (Test-Path (Join-Path $Harness 'node_modules\tsdown\package.json'))) {
  throw "tsdown not found under $Harness\node_modules — pass -Harness <checkout>"
}

# Junction so module resolution from this repo reaches the harness's packages.
if (-not (Test-Path $nodeModules)) {
  New-Item -ItemType Junction -Path $nodeModules -Target (Join-Path $Harness 'node_modules') | Out-Null
  Write-Host "linked node_modules -> $Harness\node_modules"
}

Write-Host 'generating glass-css.js...'
node (Join-Path $root 'scripts\gen-css.mjs')
if ($LASTEXITCODE -ne 0) { throw 'gen-css failed' }

Write-Host 'bundling client...'
Push-Location $root
try {
  node (Join-Path $Harness 'node_modules\tsdown\dist\run.mjs')
} finally {
  Pop-Location
}
if ($LASTEXITCODE -ne 0) { throw 'tsdown failed' }

Write-Host 'copying host half...'
Copy-Item (Join-Path $root 'src\index.js') (Join-Path $root 'lib\index.js') -Force

Write-Host 'build complete: lib/client.js + lib/index.js'
