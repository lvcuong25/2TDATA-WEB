#!/usr/bin/env pwsh

Write-Host "Setting up 2TDATA-WEB Docker Environment" -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed or not running" -ForegroundColor Red
    exit 1
}

# Create Docker network
Write-Host "Creating Docker network..." -ForegroundColor Yellow
docker network create 2tdata-network 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Network '2tdata-network' created" -ForegroundColor Green
} else {
    Write-Host "Network '2tdata-network' already exists" -ForegroundColor Cyan
}

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Build and start containers
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Containers started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available URLs:" -ForegroundColor Cyan
    Write-Host "  Main Site:      http://localhost" -ForegroundColor White
    Write-Host "  Site 1:         http://site1.localhost" -ForegroundColor White
    Write-Host "  Partner A:      http://partner-a.2tdata.com" -ForegroundColor White
    Write-Host "  Partner B:      http://partner-b.2tdata.com" -ForegroundColor White
    Write-Host "  Test Site:      http://test.example.com" -ForegroundColor White
    Write-Host ""
    Write-Host "Admin Dashboard:" -ForegroundColor Cyan
    Write-Host "  URL:            http://localhost/admin" -ForegroundColor White
    Write-Host "  Login:          superadmin@2tdata.com" -ForegroundColor White
    Write-Host "  Password:       admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "Backend API:       http://localhost:3000/api" -ForegroundColor Cyan
    Write-Host "Health Check:      http://localhost/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Remember to update your hosts file:" -ForegroundColor Yellow
    Write-Host "   Add these lines to C:\Windows\System32\drivers\etc\hosts" -ForegroundColor Gray
    Write-Host "   127.0.0.1 site1.localhost" -ForegroundColor Gray
    Write-Host "   127.0.0.1 partner-a.2tdata.com" -ForegroundColor Gray
    Write-Host "   127.0.0.1 partner-b.2tdata.com" -ForegroundColor Gray
    Write-Host "   127.0.0.1 test.example.com" -ForegroundColor Gray
} else {
    Write-Host "Failed to start containers" -ForegroundColor Red
    exit 1
}
