# Script khởi chạy 2TDATA Multi-tenant Platform với Docker
# Sử dụng cho môi trường development

Write-Host "🚀 Khởi chạy 2TDATA Multi-tenant Platform - Development Mode" -ForegroundColor Green
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
docker-compose -f docker-compose.dev.yml down -v

# Xóa image cũ để rebuild (optional)
# docker-compose -f docker-compose.dev.yml build --no-cache

# Khởi chạy services
Write-Host "🔧 Building and starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up --build -d

# Đợi một chút để services khởi động
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Kiểm tra status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml ps

# Khởi tạo database với affiliate sites
Write-Host "🗄️ Setting up database with affiliate sites..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:setup-affiliates

Write-Host ""
Write-Host "🎉 2TDATA Multi-tenant Platform is now running!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Blue
Write-Host ""

Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "• Main Site (Frontend): http://localhost:5173" -ForegroundColor White
Write-Host "• API Backend: http://localhost:3000" -ForegroundColor White
Write-Host "• MongoDB Express: http://localhost:8081 (admin/admin123)" -ForegroundColor White
Write-Host "• Nginx Proxy: http://localhost:8080" -ForegroundColor White
Write-Host ""

Write-Host "🏢 Multi-tenant Sites:" -ForegroundColor Cyan
Write-Host "• Main Site: http://localhost:5173" -ForegroundColor White
Write-Host "• TechHub Affiliate: http://techhub.localhost:5173 (Add to hosts file)" -ForegroundColor White
Write-Host "• FinanceFlow Affiliate: http://finance.localhost:5173 (Add to hosts file)" -ForegroundColor White
Write-Host ""

Write-Host "🔐 Default Login:" -ForegroundColor Cyan
Write-Host "• Super Admin: superadmin@2tdata.com / admin123" -ForegroundColor White
Write-Host "• Site Admin: admin@techhub.localhost / siteadmin123" -ForegroundColor White
Write-Host ""

Write-Host "🛠️ Development Commands:" -ForegroundColor Cyan
Write-Host "• View logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "• Stop services: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "• Restart backend: docker-compose -f docker-compose.dev.yml restart backend-dev" -ForegroundColor White
Write-Host "• Restart frontend: docker-compose -f docker-compose.dev.yml restart frontend-dev" -ForegroundColor White
Write-Host ""

Write-Host "📝 Note: Add these to your hosts file for affiliate sites:" -ForegroundColor Yellow
Write-Host "127.0.0.1 techhub.localhost" -ForegroundColor Gray
Write-Host "127.0.0.1 finance.localhost" -ForegroundColor Gray
Write-Host "127.0.0.1 site1.localhost" -ForegroundColor Gray
Write-Host "127.0.0.1 site2.localhost" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 To view real-time logs:" -ForegroundColor Green
Write-Host "docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
