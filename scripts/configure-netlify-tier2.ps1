# Wire Supabase to Netlify staging (acad-learning).
# Usage (PowerShell):
#   $env:VITE_SUPABASE_URL="https://xxxx.supabase.co"
#   $env:VITE_SUPABASE_ANON_KEY="eyJ..."
#   .\scripts\configure-netlify-tier2.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$url = $env:VITE_SUPABASE_URL
$key = $env:VITE_SUPABASE_ANON_KEY

if (-not $url -or -not $key) {
  Write-Host "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first." -ForegroundColor Yellow
  Write-Host "Get them from Supabase Dashboard -> Project Settings -> API"
  exit 1
}

Write-Host "Setting Netlify env vars on acad-learning..."
npx netlify-cli env:set VITE_SUPABASE_URL $url
npx netlify-cli env:set VITE_SUPABASE_ANON_KEY $key
npx netlify-cli env:unset VITE_DEEPSEEK_API_KEY 2>$null

Write-Host "Triggering production deploy..."
npx netlify-cli deploy --prod --build

Write-Host "Done. Site: https://acad-learning.netlify.app"
