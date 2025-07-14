# Hướng dẫn Update Dự án 2TDATA (Tính năng Multi-tenant & Affiliate Sites)

## Tổng quan Update
Bản update này bao gồm:
- Tính năng multi-tenant (tổ chức)
- Quản lý affiliate sites
- Site detection middleware
- Cập nhật database schema

## 1. Backup trước khi Update

```bash
# Backup database hiện tại
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --host localhost:27017 --db 2TDATA --username admin --password your_password --authenticationDatabase admin --out /var/backups/2tdata/backup_before_update_$DATE

# Backup source code hiện tại
cd /var/www
sudo cp -r 2tdata 2tdata_backup_$DATE
```

## 2. Update Source Code

### Cách 1: Sử dụng Git (Khuyến nghị)
```bash
cd /var/www/2tdata

# Backup file .env hiện tại
cp BE/.env BE/.env.backup

# Pull code mới
git stash  # Lưu changes local nếu có
git pull origin main

# Restore .env file
cp BE/.env.backup BE/.env
```

### Cách 2: Upload code thủ công
```bash
# Backup thư mục hiện tại
cd /var/www
sudo mv 2tdata 2tdata_old

# Upload code mới (sử dụng scp, rsync, hoặc FTP)
# Ví dụ với scp:
scp -r /path/to/new/code user@your-server:/var/www/2tdata

# Copy lại file .env và uploads
sudo cp 2tdata_old/BE/.env 2tdata/BE/
sudo cp -r 2tdata_old/BE/uploads 2tdata/BE/
```

## 3. Update Dependencies

```bash
cd /var/www/2tdata

# Update Backend dependencies
cd BE
npm install

# Update Frontend dependencies và rebuild
cd ../FE
npm install
npm run build
```

## 4. Database Migration

```bash
cd /var/www/2tdata/BE

# Chạy setup affiliate sites (thêm collections mới)
node db-management/setup-affiliate-sites.js

# Nếu cần force update (xóa và tạo lại)
# node db-management/setup-affiliate-sites.js --force

# Seed data cho multi-tenant features
node db-management/seed-data.js

# Reset superadmin nếu cần
# node db-management/reset-superadmin.js
```

## 5. Cập nhật Nginx Configuration (Nếu cần)

Kiểm tra file nginx hiện tại:
```bash
sudo nano /etc/nginx/sites-available/2tdata
```

Đảm bảo có cấu hình cho multi-domain:
```nginx
server {
    listen 80;
    server_name your-main-domain.com *.your-main-domain.com;
    
    # ... rest of config remains the same
}
```

Nếu có subdomain cho affiliate sites:
```nginx
# Thêm server block cho subdomain nếu cần
server {
    listen 80;
    server_name *.affiliates.your-domain.com;
    
    location / {
        root /var/www/2tdata/FE/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        # ... same proxy config
    }
}
```

## 6. Restart Services

```bash
# Restart backend với PM2
pm2 restart 2tdata-backend

# Hoặc nếu cần reload từ ecosystem file
cd /var/www/2tdata
pm2 reload ecosystem.config.js

# Test nginx config và reload
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Verify Update

```bash
# Kiểm tra PM2 status
pm2 status

# Kiểm tra logs
pm2 logs 2tdata-backend --lines 50

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/sites

# Kiểm tra database
mongo 2TDATA --eval "db.sites.find().count()"
mongo 2TDATA --eval "db.organizations.find().count()"
```

## 8. Environment Variables Update

Kiểm tra và cập nhật file `.env` nếu có biến mới:

```bash
cd /var/www/2tdata/BE
nano .env
```

Các biến môi trường mới có thể bao gồm:
```env
# Multi-tenant settings
DEFAULT_SITE_ID=main
ENABLE_MULTI_TENANT=true

# Affiliate settings  
AFFILIATE_DOMAIN_PATTERN=*.affiliates.yourdomain.com
```

## 9. Testing Checklist

### Backend Testing:
```bash
# Test site detection
curl -H "Host: site1.yourdomain.com" http://localhost:3000/api/sites/current

# Test organization endpoints
curl http://localhost:3000/api/organizations

# Test user management with site context
curl http://localhost:3000/api/users
```

### Frontend Testing:
- Đăng nhập vào admin panel
- Kiểm tra menu Organizations
- Kiểm tra Site Management
- Test tạo affiliate site mới
- Kiểm tra user permissions theo site

## 10. Rollback Plan (Nếu có lỗi)

Nếu update có vấn đề:

```bash
# Stop current version
pm2 stop 2tdata-backend

# Restore backup
cd /var/www
sudo rm -rf 2tdata
sudo mv 2tdata_backup_YYYYMMDD_HHMMSS 2tdata

# Restore database
mongorestore --host localhost:27017 --db 2TDATA --username admin --password your_password --authenticationDatabase admin /var/backups/2tdata/backup_before_update_YYYYMMDD_HHMMSS/2TDATA

# Restart services
pm2 start 2tdata-backend
sudo systemctl reload nginx
```

## 11. Post-Update Tasks

### Tạo Organizations và Sites:
```bash
cd /var/www/2tdata/BE

# Tạo organization mặc định
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
require('./src/config/db.js').connectDB(process.env.DB_URI);
const Organization = require('./src/models/Organization.js');

async function createDefaultOrg() {
  const org = new Organization({
    name: 'Main Organization',
    slug: 'main',
    description: 'Default organization',
    isActive: true
  });
  await org.save();
  console.log('Created default organization:', org);
  process.exit(0);
}
createDefaultOrg();
"
```

### Migrate existing users to default site:
```bash
# Script này sẽ assign tất cả users hiện tại vào site mặc định
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
require('./src/config/db.js').connectDB(process.env.DB_URI);
const User = require('./src/models/User.js');
const Site = require('./src/models/Site.js');

async function migrateUsers() {
  const defaultSite = await Site.findOne({ isDefault: true });
  if (!defaultSite) {
    console.log('No default site found');
    process.exit(1);
  }
  
  await User.updateMany(
    { sites: { \$exists: false } },
    { \$set: { sites: [defaultSite._id] } }
  );
  console.log('Migrated users to default site');
  process.exit(0);
}
migrateUsers();
"
```

## 12. Monitoring sau Update

```bash
# Monitor logs trong vài phút đầu
pm2 logs 2tdata-backend --lines 100 -f

# Kiểm tra memory usage
pm2 monit

# Kiểm tra nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Kiểm tra MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## Troubleshooting

### Lỗi thường gặp:

1. **Module not found**: 
   ```bash
   cd /var/www/2tdata/BE && npm install
   ```

2. **Database connection issues**:
   ```bash
   # Kiểm tra MongoDB status
   sudo systemctl status mongod
   
   # Kiểm tra credentials trong .env
   ```

3. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER /var/www/2tdata
   chmod -R 755 /var/www/2tdata/BE/uploads
   ```

4. **PM2 không restart**:
   ```bash
   pm2 delete 2tdata-backend
   pm2 start ecosystem.config.js
   ```

5. **Frontend không load**:
   ```bash
   cd /var/www/2tdata/FE
   npm run build
   ```

---

## Quick Update Command Summary:

```bash
# Full update sequence
cd /var/www/2tdata
git pull origin main
cd BE && npm install
cd ../FE && npm install && npm run build
cd ../BE && node db-management/setup-affiliate-sites.js
pm2 restart 2tdata-backend
sudo nginx -t && sudo systemctl reload nginx
pm2 logs 2tdata-backend --lines 20
```
