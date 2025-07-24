# Script khởi chạy 2TDATA Multi-tenant Platform với Docker
# Sử dụng cho môi trường production

Write-Host "🚀 Khởi chạy 2TDATA Multi-tenant Platform - Production Mode" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Blue

# Kiểm tra Docker có đang chạy không
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Tạo thư mục logs nếu chưa tồn tại
New-Item -ItemType Directory -Force -Path ".\BE\logs" | Out-Null
New-Item -ItemType Directory -Force -Path ".\BE\uploads\logos" | Out-Null

Write-Host "📁 Created necessary directories" -ForegroundColor Green

# Dừng các container cũ nếu có
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down -v

# Xóa image cũ để rebuild production
Write-Host "🔧 Building production images..." -ForegroundColor Yellow
docker-compose build --no-cache

# Khởi chạy services
Write-Host "🚀 Starting production services..." -ForegroundColor Yellow
docker-compose up -d

# Đợi một chút để services khởi động
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Kiểm tra status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Khởi tạo database với affiliate sites
Write-Host "🗄️ Setting up database with affiliate sites..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose exec backend npm run db:setup-affiliates

Write-Host ""
Write-Host "🎉 2TDATA Multi-tenant Platform is now running in Production!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Blue
Write-Host ""

Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "• Main Site (Frontend): http://localhost" -ForegroundColor White
Write-Host "• API Backend: http://localhost:3000" -ForegroundColor White
Write-Host "• MongoDB Express: http://localhost:8081 (admin/admin123)" -ForegroundColor White
Write-Host "• Nginx Proxy: http://localhost:8080" -ForegroundColor White
Write-Host ""

Write-Host "🏢 Multi-tenant Sites:" -ForegroundColor Cyan
Write-Host "• Main Site: http://localhost" -ForegroundColor White
Write-Host "• TechHub Affiliate: http://techhub.localhost (Add to hosts file)" -ForegroundColor White
Write-Host "• FinanceFlow Affiliate: http://finance.localhost (Add to hosts file)" -ForegroundColor White
Write-Host ""

Write-Host "🔐 Default Login:" -ForegroundColor Cyan
Write-Host "• Super Admin: superadmin@2tdata.com / admin123" -ForegroundColor White
Write-Host "• Site Admin: admin@techhub.localhost / siteadmin123" -ForegroundColor White
Write-Host ""

Write-Host "🛠️ Production Commands:" -ForegroundColor Cyan
Write-Host "• View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "• Stop services: docker-compose down" -ForegroundColor White
Write-Host "• Restart backend: docker-compose restart backend" -ForegroundColor White
Write-Host "• Restart frontend: docker-compose restart frontend" -ForegroundColor White
Write-Host ""

Write-Host "📝 Note: Add these to your hosts file for affiliate sites:" -ForegroundColor Yellow
Write-Host "127.0.0.1 techhub.localhost" -ForegroundColor Gray
Write-Host "127.0.0.1 finance.localhost" -ForegroundColor Gray
Write-Host "127.0.0.1 site1.localhost" -ForegroundColor Gray
Write-Host "127.0.0.1 site2.localhost" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 To view real-time logs:" -ForegroundColor Green
Write-Host "docker-compose logs -f" -ForegroundColor White
