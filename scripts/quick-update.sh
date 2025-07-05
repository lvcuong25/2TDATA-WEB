#!/bin/bash

# Quick Update Script cho 2TDATA
# Dành cho update tính năng multi-tenant và affiliate sites

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "🚀 Bắt đầu update 2TDATA với tính năng Multi-tenant & Affiliate Sites..."

# Kiểm tra xem có đang ở đúng thư mục không
if [ ! -d "/var/www/2tdata" ]; then
    print_error "Không tìm thấy thư mục /var/www/2tdata"
    exit 1
fi

cd /var/www/2tdata

# 1. Backup
print_step "1. Tạo backup..."
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
print_status "Backup database..."
mkdir -p /var/backups/2tdata
mongodump --host localhost:27017 --db 2TDATA --out /var/backups/2tdata/backup_$DATE

# Backup source code
print_status "Backup source code..."
cd /var/www
sudo cp -r 2tdata 2tdata_backup_$DATE
cd 2tdata

print_status "✅ Backup hoàn tất"

# 2. Update source code
print_step "2. Update source code..."

# Backup .env file
cp BE/.env BE/.env.backup_$DATE

# Update code (nếu có git)
if [ -d ".git" ]; then
    print_status "Updating với Git..."
    git stash
    git pull origin main
else
    print_warning "Không tìm thấy Git repository. Upload code mới thủ công và chạy lại script."
    read -p "Đã upload code mới xong? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Restore .env
cp BE/.env.backup_$DATE BE/.env

print_status "✅ Source code updated"

# 3. Update dependencies
print_step "3. Update dependencies..."

# Backend
print_status "Installing backend dependencies..."
cd BE
npm install

# Frontend
print_status "Installing frontend dependencies và building..."
cd ../FE
npm install
npm run build

print_status "✅ Dependencies updated"

# 4. Database migration
print_step "4. Database migration..."
cd ../BE

print_status "Setting up affiliate sites..."
node db-management/setup-affiliate-sites.js

print_status "Seeding data..."
node db-management/seed-data.js

print_status "✅ Database migration completed"

# 5. Restart services
print_step "5. Restart services..."

print_status "Restarting backend with PM2..."
pm2 restart 2tdata-backend || pm2 start ecosystem.config.js

print_status "Testing nginx config..."
sudo nginx -t

print_status "Reloading nginx..."
sudo systemctl reload nginx

print_status "✅ Services restarted"

# 6. Verification
print_step "6. Verification..."

sleep 3

print_status "Checking PM2 status..."
pm2 status

print_status "Testing API endpoints..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    print_status "✅ Health check passed"
else
    print_warning "⚠️ Health check failed"
fi

if curl -s http://localhost:3000/api/sites > /dev/null; then
    print_status "✅ Sites endpoint accessible"
else
    print_warning "⚠️ Sites endpoint may not be ready yet"
fi

# 7. Show logs
print_step "7. Checking recent logs..."
pm2 logs 2tdata-backend --lines 10 --nostream

echo
print_status "🎉 Update completed successfully!"
print_warning "Kiểm tra những điều sau:"
echo "1. Đăng nhập admin panel và kiểm tra menu Organizations"
echo "2. Test tạo affiliate site mới"
echo "3. Kiểm tra site detection với subdomain"
echo "4. Verify user permissions"

echo
echo "📝 Backup locations:"
echo "- Database: /var/backups/2tdata/backup_$DATE"
echo "- Source code: /var/www/2tdata_backup_$DATE"

echo
print_warning "Nếu có vấn đề, chạy rollback:"
echo "cd /var/www"
echo "sudo rm -rf 2tdata"
echo "sudo mv 2tdata_backup_$DATE 2tdata"
echo "mongorestore --drop --host localhost:27017 --db 2TDATA /var/backups/2tdata/backup_$DATE/2TDATA"
echo "pm2 restart 2tdata-backend"
