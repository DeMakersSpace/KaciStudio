param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not on PATH."
}

$env:PORT = [string]$Port

Write-Host "Starting KACISTUDIO at http://localhost:$Port"
Write-Host "Press Ctrl+C to stop the server."

node .\serve.mjs
