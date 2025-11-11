# Start Prestige in development mode
# Kill any existing processes
Write-Host "Stopping any existing processes..." -ForegroundColor Yellow
Stop-Process -Name "node","electron" -Force -ErrorAction SilentlyContinue

# Set environment variables
$env:VITE_DEV_SERVER_PORT = "5173"
$env:REACT_APP_NAME = "PrestigeElec"
$env:REACT_APP_MODE = "electron"
$env:BROWSER = "none"
$env:SKIP_PREFLIGHT_CHECK = "true"

Write-Host "Starting Vite and Electron..." -ForegroundColor Green
Write-Host "Vite will be on http://localhost:5173" -ForegroundColor Cyan

# Start both processes
Start-Job -ScriptBlock {
    Set-Location "d:\Github\prestige"
    yarn vite --port 5173
} | Out-Null

# Wait for Vite to be ready
Write-Host "Waiting for Vite to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 1 -ErrorAction Stop
        $viteReady = $true
    } catch {
        $viteReady = $false
    }
} while (-not $viteReady -and $attempt -lt $maxAttempts)

if ($viteReady) {
    Write-Host "Vite is ready! Starting Electron..." -ForegroundColor Green
    & "$PSScriptRoot\node_modules\.bin\electron.cmd" "$PSScriptRoot\public\electron-dev.js"
} else {
    Write-Host "Vite failed to start. Please check for errors." -ForegroundColor Red
    Get-Job | Stop-Job
    Get-Job | Remove-Job
}
