# YojnaMitra - Run on Android
# Run this from the project root: .\android.ps1

$NODE = "C:\nvm4w\nodejs\node.exe"
$env:NODE_HOME = "C:\nvm4w\nodejs"
$env:Path = "C:\nvm4w\nodejs;" + $env:Path

# Ensure JAVA_HOME points to a valid Java installation (Android Studio JBR or JDK 24)
if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "C:\Program Files\Android\Android Studio\jbr\bin\java.exe") {
        $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    } elseif (Test-Path "C:\Program Files\Java\jdk-24\bin\java.exe") {
        $env:JAVA_HOME = "C:\Program Files\Java\jdk-24"
    }
}
if ($env:JAVA_HOME) {
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}

Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host "  YojnaMitra - Run Android  " -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Node:      $(& $NODE --version)" -ForegroundColor Green
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""
# Reverse backend API ports so the phone can reach localhost over USB cable
$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $ADB) {
    Write-Host "Reversing backend ports over USB (5000, 8765)..." -ForegroundColor Cyan
    & $ADB reverse tcp:5000 tcp:5000
    & $ADB reverse tcp:8765 tcp:8765
}

Write-Host "Running on Android..." -ForegroundColor Yellow
Write-Host ""

& $NODE "$PSScriptRoot\node_modules\.bin\react-native" run-android
