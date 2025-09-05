# Windows PowerShell script to clean up Chromium processes and start the app
# Equivalent to: pkill -f chromium; rm -rf .wwebjs_auth//Default/Singleton; rm -rf /tmp/chrome-user-data*; npm start

Write-Host "🧹 Cleaning up Chromium processes and temp files..." -ForegroundColor Yellow

# Kill Chrome/Chromium processes (Windows equivalent of pkill -f chromium)
Get-Process -Name "chrome", "chromium" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Chrome/Chromium processes terminated" -ForegroundColor Green

# Remove Chrome singleton lock files (Windows paths)
if (Test-Path ".wwebjs_auth") {
    Remove-Item -Recurse -Force ".wwebjs_auth\*\Default\Singleton*" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force ".wwebjs_auth\*\lockfile*" -ErrorAction SilentlyContinue
    Write-Host "✅ WhatsApp auth singleton files removed" -ForegroundColor Green
}

# Remove temporary Chrome user data (Windows temp directories)
$tempPaths = @(
    "$env:TEMP\chrome-user-data*",
    "$env:TEMP\puppeteer_dev_chrome_profile*",
    "$env:LOCALAPPDATA\Temp\chrome-user-data*"
)

foreach ($path in $tempPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "✅ Removed temp Chrome data: $path" -ForegroundColor Green
    }
}

# Remove any leftover Chrome cache
Remove-Item -Recurse -Force ".wwebjs_cache\*" -ErrorAction SilentlyContinue
Write-Host "✅ WhatsApp cache cleared" -ForegroundColor Green

Write-Host "🚀 Starting the application..." -ForegroundColor Cyan
npm start
