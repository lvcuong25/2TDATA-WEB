# PowerShell script to start PostgreSQL for local development
Write-Host "🐘 Starting PostgreSQL for 2TDATA Migration Testing..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop or use Option 1 (direct PostgreSQL installation)" -ForegroundColor Yellow
    exit 1
}

# Start PostgreSQL container
Write-Host "🚀 Starting PostgreSQL container..." -ForegroundColor Blue
docker-compose -f docker-compose.postgres.yml up -d

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    try {
        $result = docker exec 2tdata-postgres pg_isready -U postgres
        if ($result -match "accepting connections") {
            Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ PostgreSQL failed to start within timeout" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 2
    Write-Host "⏳ Attempt $attempt/$maxAttempts..." -ForegroundColor Yellow
} while ($true)

# Show connection info
Write-Host "`n📊 PostgreSQL Connection Info:" -ForegroundColor Cyan
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White
Write-Host "Database: 2tdata_postgres" -ForegroundColor White
Write-Host "Username: postgres" -ForegroundColor White
Write-Host "Password: password" -ForegroundColor White

Write-Host "`n🌐 PgAdmin (Web Interface):" -ForegroundColor Cyan
Write-Host "URL: http://localhost:8080" -ForegroundColor White
Write-Host "Email: admin@2tdata.com" -ForegroundColor White
Write-Host "Password: admin" -ForegroundColor White

Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "Stop PostgreSQL: docker-compose -f docker-compose.postgres.yml down" -ForegroundColor White
Write-Host "View logs: docker-compose -f docker-compose.postgres.yml logs -f" -ForegroundColor White
Write-Host "Connect via psql: docker exec -it 2tdata-postgres psql -U postgres -d 2tdata_postgres" -ForegroundColor White

Write-Host "`n✅ PostgreSQL is ready for migration testing!" -ForegroundColor Green
