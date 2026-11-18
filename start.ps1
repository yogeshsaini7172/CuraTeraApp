# ==============================================================================
# CuraTera Mobile App - React Native Starter Script
# Usage from CuraTeraApp directory:
#   .\start.ps1              -> Starts Metro bundler + ADB reverse
#   .\start.ps1 -All         -> Launches full stack (Backend + Web + Voice + Metro)
# ==============================================================================

param (
    [switch]$All,
    [switch]$ResetCache
)

$ErrorActionPreference = "Continue"

if ($All) {
    $parentScript = Join-Path (Split-Path $PSScriptRoot -Parent) "start-all.ps1"
    if (Test-Path $parentScript) {
        Write-Host "Redirecting to Full-Stack Launcher..." -ForegroundColor Cyan
        & $parentScript
        exit
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "          CURATERA MOBILE DEV SERVER              " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Find Node
$Node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $Node -and (Test-Path "C:\Program Files\nodejs\node.exe")) { $Node = "C:\Program Files\nodejs\node.exe" }
if (-not $Node -and (Test-Path "C:\nvm4w\nodejs\node.exe")) { $Node = "C:\nvm4w\nodejs\node.exe" }

$Npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $Npm -and (Test-Path "C:\Program Files\nodejs\npm.cmd")) { $Npm = "C:\Program Files\nodejs\npm.cmd" }

# Set up ADB Reverse if available
$Adb = (Get-Command adb.exe -ErrorAction SilentlyContinue).Source
if (-not $Adb -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe")) {
    $Adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
}

if ($Adb) {
    try {
        & $Adb reverse tcp:5000 tcp:5000 2>$null
        & $Adb reverse tcp:8765 tcp:8765 2>$null
        & $Adb reverse tcp:8081 tcp:8081 2>$null
        Write-Host "[+] ADB Reverse configured (5000, 8765, 8081) for USB device" -ForegroundColor Green
    } catch {}
}

# Check backend status
$backendOk = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:5000/" -Method Get -TimeoutSec 1 -ErrorAction SilentlyContinue
    if ($res) { $backendOk = $true }
} catch {}

if ($backendOk) {
    Write-Host "[+] Backend API (Port 5000): CONNECTED & HEALTHY" -ForegroundColor Green
} else {
    Write-Host "[!] Note: Backend API (Port 5000) is NOT running." -ForegroundColor Yellow
    Write-Host "    To start the full system together, run: .\start.ps1 -All" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Starting React Native Metro Bundler..." -ForegroundColor Yellow
Write-Host ""

if ($ResetCache) {
    & $Npm start -- --reset-cache
} else {
    & $Npm start
}
