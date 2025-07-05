# Hướng dẫn triển khai dự án lên VPS (Không Docker)

## 1. Chuẩn bị VPS

### Yêu cầu hệ thống:
- Ubuntu 20.04+ hoặc CentOS 8+
- RAM: tối thiểu 2GB (khuyến nghị 4GB)
- Storage: tối thiểu 20GB
- CPU: 2 cores

### Cài đặt các dependencies cần thiết:

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js 18+ (sử dụng NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Cài đặt Nginx
sudo apt install nginx -y

# Cài đặt PM2 để quản lý Node.js process
sudo npm install -g pm2

# Cài đặt Git
sudo apt install git -y
```

## 2. Cấu hình MongoDB

```bash
# Khởi động MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Tạo user admin cho MongoDB
mongo
```

Trong MongoDB shell:
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your_strong_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

use 2TDATA
db.createUser({
  user: "admin",
  pwd: "your_strong_password",
  roles: ["readWrite"]
})
exit
```

Cấu hình MongoDB authentication:
```bash
sudo nano /etc/mongod.conf
```

Thêm/sửa trong file:
```yaml
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

## 3. Chuẩn bị source code

```bash
# Tạo thư mục project
sudo mkdir -p /var/www/2tdata
sudo chown $USER:$USER /var/www/2tdata
cd /var/www/2tdata

# Clone project (hoặc upload code)
git clone <your-repo-url> .
# HOẶC scp code từ máy local
```

## 4. Cấu hình Backend

```bash
cd /var/www/2tdata/BE

# Cài đặt dependencies
npm install --production

# Tạo file môi trường cho production
cp .env .env.production
nano .env.production
```

Cấu hình `.env.production`:
```env
# Database Configuration
DB_URI=mongodb://admin:your_strong_password@localhost:27017/2TDATA?authSource=admin
MONGODB_URI=mongodb://admin:your_strong_password@localhost:27017/2TDATA?authSource=admin

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration
SECRET_KEY="your_jwt_secret_key_here"
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN=24h

# Email Configuration
SEND_OTP_EMAIL="your_email@gmail.com"
SEND_OTP_EMAIL_PASSWORD="your_app_password"

# Logging
LOG_LEVEL=info

# Security
BCRYPT_SALT_ROUNDS=12
```

Tạo thư mục uploads:
```bash
mkdir -p uploads/logos
chmod 755 uploads
chmod 755 uploads/logos
```

## 5. Cấu hình Frontend

```bash
cd /var/www/2tdata/FE

# Cài đặt dependencies
npm install

# Tạo file cấu hình môi trường
nano .env.production
```

File `.env.production` cho Frontend:
```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_NODE_ENV=production
```

Cập nhật cấu hình API base URL trong code (nếu cần):
```bash
# Tìm và thay thế localhost thành domain thực
find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "localhost:3000"
```

Build production:
```bash
npm run build
```

## 6. Cấu hình PM2

Tạo file cấu hình PM2:
```bash
nano /var/www/2tdata/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: '2tdata-backend',
      script: './BE/src/app.js',
      cwd: '/var/www/2tdata',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: './BE/.env.production',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
```

Tạo thư mục logs:
```bash
mkdir -p /var/www/2tdata/logs
```

Khởi động ứng dụng với PM2:
```bash
cd /var/www/2tdata
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 7. Cấu hình Nginx

Tạo file cấu hình Nginx:
```bash
sudo nano /etc/nginx/sites-available/2tdata
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /var/www/2tdata/FE/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads and static files
    location /uploads {
        alias /var/www/2tdata/BE/uploads;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /logos {
        alias /var/www/2tdata/BE/uploads/logos;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Security
    location ~ /\. {
        deny all;
    }

    # File size limits
    client_max_body_size 50M;
}
```

Kích hoạt site:
```bash
sudo ln -s /etc/nginx/sites-available/2tdata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Cài đặt SSL với Let's Encrypt (Tùy chọn)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 9. Khởi tạo Database

```bash
cd /var/www/2tdata/BE

# Chạy setup database
node db-management/setup-affiliate-sites.js
node db-management/seed-data.js
node db-management/reset-superadmin.js
```

## 10. Kiểm tra và Monitor

```bash
# Kiểm tra status các service
sudo systemctl status mongod
sudo systemctl status nginx
pm2 status

# Xem logs
pm2 logs 2tdata-backend
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Kiểm tra port
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :27017
```

## 11. Scripts quản lý

Tạo script khởi động lại ứng dụng:
```bash
nano /var/www/2tdata/restart-app.sh
```

```bash
#!/bin/bash
echo "Restarting 2TDATA application..."

# Restart backend
pm2 restart 2tdata-backend

# Reload nginx
sudo systemctl reload nginx

echo "Application restarted successfully!"
```

```bash
chmod +x /var/www/2tdata/restart-app.sh
```

## 12. Backup và Recovery

Tạo script backup database:
```bash
nano /var/www/2tdata/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/2tdata"
mkdir -p $BACKUP_DIR

mongodump --host localhost:27017 --db 2TDATA --username admin --password your_strong_password --authenticationDatabase admin --out $BACKUP_DIR/backup_$DATE

echo "Database backup completed: $BACKUP_DIR/backup_$DATE"
```

## 13. Firewall Configuration

```bash
# Cấu hình UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Chặn MongoDB port từ bên ngoài (chỉ cho local access)
sudo ufw deny 27017
```

## 14. Performance Optimization

Cấu hình Nginx cho performance:
```bash
sudo nano /etc/nginx/nginx.conf
```

Thêm vào http block:
```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
  text/plain
  text/css
  text/xml
  text/javascript
  application/json
  application/javascript
  application/xml+rss
  application/atom+xml
  image/svg+xml;

# File caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Lưu ý quan trọng:

1. **Bảo mật**: Thay đổi tất cả password mặc định
2. **Backup**: Thiết lập backup tự động cho database
3. **Monitor**: Cài đặt monitoring tools (như htop, iotop)
4. **Updates**: Thường xuyên cập nhật hệ thống và dependencies
5. **Logs**: Thiết lập log rotation để tránh đầy disk

## Troubleshooting:

- Nếu backend không khởi động: Kiểm tra logs PM2
- Nếu frontend không load: Kiểm tra nginx error logs
- Nếu không kết nối database: Kiểm tra MongoDB status và credentials
- Nếu upload không hoạt động: Kiểm tra permissions của thư mục uploads
