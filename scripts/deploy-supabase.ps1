# Deploy Supabase secrets + edge functions (run locally — never commit secrets)
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
#   $env:DEEPSEEK_API_KEY="sk-..."
#   .\scripts\deploy-supabase.ps1
#
# Requires Supabase CLI — download from https://github.com/supabase/cli/releases
# or set $env:SUPABASE_CLI to path of supabase.exe

$ErrorActionPreference = "Stop"
$ProjectRef = "qiovvyvkhmmbpihnonqo"
$root = Split-Path $PSScriptRoot -Parent

if (-not $env:SUPABASE_ACCESS_TOKEN) { throw "Set SUPABASE_ACCESS_TOKEN" }
if (-not $env:DEEPSEEK_API_KEY) { throw "Set DEEPSEEK_API_KEY" }

$sb = $env:SUPABASE_CLI
if (-not $sb) { $sb = Join-Path $env:TEMP "supabase-cli\supabase.exe" }
if (-not (Test-Path $sb)) { throw "Supabase CLI not found at $sb — set SUPABASE_CLI or download the CLI" }

$headers = @{
  Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN"
  "Content-Type" = "application/json"
}

Write-Host "Setting DEEPSEEK_API_KEY secret..."
$escaped = $env:DEEPSEEK_API_KEY -replace '\\', '\\\\' -replace '"', '\"'
$secretsBody = "[{`"name`":`"DEEPSEEK_API_KEY`",`"value`":`"$escaped`"}]"
Invoke-RestMethod -Method POST -Uri "https://api.supabase.com/v1/projects/$ProjectRef/secrets" -Headers $headers -Body $secretsBody | Out-Null
Write-Host "Secret set."

$env:SUPABASE_ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN
Push-Location $root
try {
  foreach ($fn in @("academic-profile", "buddy-chat", "delete-account")) {
    Write-Host "Deploying $fn..."
    & $sb functions deploy $fn --project-ref $ProjectRef
  }
} finally {
  Pop-Location
}

Write-Host "Done."
