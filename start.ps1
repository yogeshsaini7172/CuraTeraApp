# YojnaMitra - React Native CLI Starter Script
# Run this from the project root: .\start.ps1

$NODE = "C:\nvm4w\nodejs\node.exe"
$NPM  = "C:\nvm4w\nodejs\npm.cmd"
$NPX  = "C:\nvm4w\nodejs\npx.cmd"

Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host "   YojnaMitra Dev Server    " -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Node: $(& $NODE --version)" -ForegroundColor Green
Write-Host "npm:  $(& $NPM --version)" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Metro Bundler..." -ForegroundColor Yellow
Write-Host ""

& $NODE "$PSScriptRoot\node_modules\.bin\react-native" start
