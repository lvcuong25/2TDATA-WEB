# 🐳 2TDATA Multi-tenant Platform - Docker Setup

Hướng dẫn chạy dự án 2TDATA Multi-tenant Platform với Docker trên localhost.

## 📋 Yêu cầu hệ thống

- **Docker Desktop** 4.0+ (Windows/Mac) hoặc Docker Engine 20.10+ (Linux)
- **Docker Compose** 2.0+
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Disk Space**: Tối thiểu 2GB trống

## 🚀 Khởi chạy nhanh

### Development Mode (Khuyến nghị cho phát triển)

```powershell
# Khởi chạy với script PowerShell
.\start-dev.ps1

# Hoặc chạy thủ công
docker-compose -f docker-compose.dev.yml up --build -d
```

### Production Mode

```powershell
# Khởi chạy với script PowerShell
.\start-prod.ps1

# Hoặc chạy thủ công
docker-compose up --build -d
```

## 🌐 Các URL truy cập

### Development Mode
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MongoDB Express**: http://localhost:8081 (admin/admin123)
- **Nginx Proxy**: http://localhost:8080

### Production Mode
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **MongoDB Express**: http://localhost:8081 (admin/admin123)
- **Nginx Proxy**: http://localhost:8080

## 🏢 Multi-tenant Sites

### Main Site
- **URL**: http://localhost (hoặc :5173 cho dev)
- **Theme**: Blue theme
- **Features**: Full admin panel, user management

### TechHub Affiliate Site
- **URL**: http://techhub.localhost (hoặc :5173 cho dev)
- **Theme**: Green theme
- **Features**: Tech-focused affiliate site

### FinanceFlow Affiliate Site
- **URL**: http://finance.localhost (hoặc :5173 cho dev)
- **Theme**: Purple theme
- **Features**: Finance-focused affiliate site

## 🔧 Cấu hình Hosts File

Để truy cập affiliate sites, thêm các dòng sau vào file hosts:

### Windows
File: `C:\Windows\System32\drivers\etc\hosts`

### macOS/Linux
File: `/etc/hosts`

```
127.0.0.1 techhub.localhost
127.0.0.1 finance.localhost
127.0.0.1 site1.localhost
127.0.0.1 site2.localhost
```

## 🔐 Thông tin đăng nhập mặc định

### Super Admin (Toàn quyền)
- **Email**: superadmin@2tdata.com
- **Password**: admin123
- **Permissions**: Quản lý tất cả sites, tạo/sửa/xóa sites

### Site Admin - TechHub
- **Email**: admin@techhub.localhost
- **Password**: siteadmin123
- **Permissions**: Quản lý TechHub site

### Site Admin - FinanceFlow
- **Email**: admin@finance.localhost
- **Password**: siteadmin123
- **Permissions**: Quản lý FinanceFlow site

## 🛠️ Các lệnh Docker hữu ích

### Xem logs
```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend

# Development mode
docker-compose -f docker-compose.dev.yml logs -f backend-dev
```

### Restart services
```bash
# Restart backend
docker-compose restart backend

# Restart frontend
docker-compose restart frontend

# Development mode
docker-compose -f docker-compose.dev.yml restart backend-dev
```

### Stop/Start services
```bash
# Stop tất cả
docker-compose down

# Stop và xóa volumes
docker-compose down -v

# Start lại
docker-compose up -d

# Development mode
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Rebuild images
```bash
# Rebuild tất cả images
docker-compose build --no-cache

# Rebuild service cụ thể
docker-compose build --no-cache backend
```

### Truy cập container
```bash
# Truy cập backend container
docker-compose exec backend sh

# Truy cập frontend container
docker-compose exec frontend sh

# Development mode
docker-compose -f docker-compose.dev.yml exec backend-dev sh
```

## 🗄️ Database Management

### Khởi tạo database với affiliate sites
```bash
# Production
docker-compose exec backend npm run db:setup-affiliates

# Development
docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:setup-affiliates
```

### Các lệnh database khác
```bash
# Reset database
docker-compose exec backend npm run db:reset

# Seed data
docker-compose exec backend npm run db:seed

# Reset super admin
docker-compose exec backend npm run db:reset-admin
```

### Truy cập MongoDB
- **MongoDB Express**: http://localhost:8081
- **Username**: admin
- **Password**: admin123

Hoặc kết nối trực tiếp:
```bash
# Truy cập MongoDB container
docker-compose exec mongodb mongo -u admin -p password123 --authenticationDatabase admin

# Sử dụng database
use 2TDATA
```

## 📊 Monitoring & Debugging

### Health Checks
```bash
# Kiểm tra health backend
curl http://localhost:3000/health

# Kiểm tra site detection
curl -H "Host: techhub.localhost" http://localhost:3000/api/sites/current
```

### Performance Monitoring
```bash
# Xem resource usage
docker stats

# Xem logs với timestamp
docker-compose logs -f -t
```

## 🔄 Hot Reload (Development Mode)

Development mode hỗ trợ hot reload:

- **Backend**: Nodemon tự động restart khi code thay đổi
- **Frontend**: Vite HMR (Hot Module Replacement)

## 📁 Cấu trúc Docker Files

```
2TDATA-WEB/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── init-mongo.js              # MongoDB initialization
├── start-dev.ps1              # Development startup script
├── start-prod.ps1             # Production startup script
├── BE/
│   ├── Dockerfile             # Backend production
│   ├── Dockerfile.dev         # Backend development
│   └── .dockerignore
├── FE/
│   ├── Dockerfile             # Frontend production
│   ├── Dockerfile.dev         # Frontend development
│   ├── nginx.conf             # Nginx configuration
│   └── .dockerignore
└── nginx/
    ├── nginx.conf             # Main nginx config
    └── conf.d/
        ├── localhost.conf     # Main site config
        └── affiliate-sites.conf # Affiliate sites config
```

## 🚨 Troubleshooting

### Port conflicts
```bash
# Kiểm tra ports đang sử dụng
netstat -an | findstr :3000
netstat -an | findstr :5173
netstat -an | findstr :27017
```

### Container không start
```bash
# Xem logs chi tiết
docker-compose logs service-name

# Xóa tất cả và start lại
docker-compose down -v
docker-compose up --build -d
```

### Database connection issues
```bash
# Restart MongoDB
docker-compose restart mongodb

# Kiểm tra MongoDB logs
docker-compose logs mongodb
```

### Frontend không load
```bash
# Rebuild frontend
docker-compose build --no-cache frontend

# Kiểm tra nginx logs
docker-compose logs nginx-proxy
```

## 🔧 Customization

### Thay đổi ports
Sửa file `docker-compose.yml` hoặc `docker-compose.dev.yml`:

```yaml
services:
  backend:
    ports:
      - "3001:3000"  # Đổi port backend thành 3001
  
  frontend:
    ports:
      - "8080:80"    # Đổi port frontend thành 8080
```

### Thêm affiliate site mới
1. Sửa file `init-mongo.js` để thêm site mới
2. Sửa file `nginx/conf.d/affiliate-sites.conf` để thêm cấu hình nginx
3. Rebuild và restart containers

## 📝 Notes

- **Development mode** sử dụng volumes cho hot reload
- **Production mode** build static files vào image
- **MongoDB data** được lưu trong Docker volumes
- **Uploads** được lưu trong Docker volumes
- **Logs** được mount từ host để dễ truy cập

## 🤝 Support

Nếu gặp vấn đề, kiểm tra:
1. Docker Desktop có đang chạy không
2. Ports có bị conflicts không
3. Disk space có đủ không
4. Logs containers có error gì không

Happy coding! 🚀
