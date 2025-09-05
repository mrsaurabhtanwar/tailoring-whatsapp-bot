@echo off
echo 🧹 Cleaning up Chromium processes and temp files...

REM Kill Chrome/Chromium processes
taskkill /F /IM chrome.exe /T >nul 2>&1
taskkill /F /IM chromium.exe /T >nul 2>&1
echo ✅ Chrome/Chromium processes terminated

REM Remove WhatsApp auth singleton and lock files
if exist ".wwebjs_auth" (
    rmdir /S /Q ".wwebjs_auth" >nul 2>&1
    echo ✅ WhatsApp auth files removed
)

REM Remove Chrome cache
if exist ".wwebjs_cache" (
    rmdir /S /Q ".wwebjs_cache" >nul 2>&1
    echo ✅ WhatsApp cache cleared
)

REM Remove temp Chrome data
rmdir /S /Q "%TEMP%\chrome-user-data*" >nul 2>&1
rmdir /S /Q "%LOCALAPPDATA%\Temp\chrome-user-data*" >nul 2>&1

echo 🚀 Starting the application...
npm start
