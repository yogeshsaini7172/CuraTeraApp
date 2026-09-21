# YojnaMitra - Run on Android
# Run this from the project root: .\android.ps1

$NODE = "C:\nvm4w\nodejs\node.exe"
$env:NODE_HOME = "C:\nvm4w\nodejs"
$env:Path = "C:\nvm4w\nodejs;" + $env:Path

Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host "  YojnaMitra - Run Android  " -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Node: $(& $NODE --version)" -ForegroundColor Green
Write-Host ""
Write-Host "Running on Android..." -ForegroundColor Yellow
Write-Host ""

& $NODE "$PSScriptRoot\node_modules\.bin\react-native" run-android
