# verify.ps1 - PowerShell version of verify.sh for Windows
# Smoke test script for WhatsApp Bot deployment

Write-Host "🔍 Starting verification process..." -ForegroundColor Cyan

# Function to cleanup background processes
function Cleanup {
    if ($global:AppProcess) {
        Write-Host "🧹 Stopping background server..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $global:AppProcess.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        catch {
            # Process may have already stopped
        }
    }
}

# Set trap to cleanup on script exit
trap { Cleanup; exit 1 }

try {
    # Step 1: Clean install dependencies
    Write-Host "📦 Installing dependencies with npm ci..." -ForegroundColor Green
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

    # Step 2: Build if build script exists, otherwise run install
    Write-Host "🔨 Checking for build script..." -ForegroundColor Green
    $buildScript = npm run 2>&1 | Select-String "build"
    if ($buildScript) {
        Write-Host "📦 Running npm run build..." -ForegroundColor Green
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    }
    else {
        Write-Host "ℹ️  No build script found, dependencies already installed" -ForegroundColor Yellow
    }

    # Step 3: Find a free port
    $TestPort = Get-Random -Minimum 8000 -Maximum 9000
    $portInUse = $true
    $attempts = 0
    while ($portInUse -and $attempts -lt 20) {
        $TestPort = Get-Random -Minimum 8000 -Maximum 9000
        $portCheck = Get-NetTCPConnection -LocalPort $TestPort -ErrorAction SilentlyContinue
        if (-not $portCheck) {
            $portInUse = $false
        }
        $attempts++
    }

    Write-Host "🚀 Starting server on port $TestPort..." -ForegroundColor Green

    # Step 4: Start the app in background
    $env:PORT = $TestPort
    $env:NODE_ENV = "production"
    $global:AppProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
    
    Write-Host "📋 Server started with PID: $($global:AppProcess.Id) on port $TestPort" -ForegroundColor Green

    # Step 5: Wait for server to be ready
    Write-Host "⏳ Waiting for server to be ready..." -ForegroundColor Green
    Start-Sleep -Seconds 5

    # Step 6: Health check with retry loop
    $HealthUrl = "http://localhost:$TestPort/healthz"
    $Success = $false

    Write-Host "🩺 Testing health endpoint: $HealthUrl" -ForegroundColor Green

    for ($i = 1; $i -le 20; $i++) {
        Write-Host "   Attempt $i/20..." -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
            $HttpStatus = $response.StatusCode
        }
        catch {
            $HttpStatus = 0
        }
        
        Write-Host "   HTTP Status: $HttpStatus" -ForegroundColor Gray
        
        if ($HttpStatus -eq 200) {
            $Success = $true
            Write-Host "✅ Health check passed!" -ForegroundColor Green
            break
        }
        
        if ($i -lt 20) {
            Write-Host "   Retrying in 3 seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    }

    # Step 7: Print results and exit
    if ($Success) {
        Write-Host ""
        Write-Host "🎉 VERIFICATION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   - Dependencies installed ✅" -ForegroundColor Green
        Write-Host "   - Server started on port $TestPort ✅" -ForegroundColor Green
        Write-Host "   - Health endpoint responding ✅" -ForegroundColor Green
        Write-Host ""
        Cleanup
        exit 0
    }
    else {
        Write-Host ""
        Write-Host "❌ VERIFICATION FAILED!" -ForegroundColor Red
        Write-Host "   Health endpoint did not respond with 200 after 20 attempts" -ForegroundColor Red
        Write-Host "   Check server logs above for errors" -ForegroundColor Red
        Write-Host ""
        Cleanup
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ VERIFICATION FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Cleanup
    exit 1
}
