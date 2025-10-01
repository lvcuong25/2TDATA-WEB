# Environment Setup Guide

## Tổng quan
File này hướng dẫn cách setup environment variables cho 2TDATA-WEB Backend.

## Các file environment

### 1. Development Environment
```bash
# Copy template file
cp env-template.txt .env

# Hoặc tạo file .env mới với nội dung:
```

**File `.env` cho development:**
```env
# Database Configuration
USE_POSTGRES=true
USE_MONGO=true

# PostgreSQL Configuration
POSTGRES_DB=2tdata_postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# MongoDB Configuration
DB_URI=mongodb://localhost:27017/2TDATA-P
MONGODB_URI=mongodb://localhost:27017/2TDATA-P

# Server Configuration
PORT=3004
NODE_ENV=development

# Authentication
SECRET_KEY="dev_secret_key_change_in_production"
JWT_SECRET="dev_jwt_secret_key_change_in_production"
JWT_EXPIRES_IN=24h

# Security
BCRYPT_SALT_ROUNDS=12

# Email Configuration
SEND_OTP_EMAIL="your_email_here"
SEND_OTP_EMAIL_PASSWORD="your_email_app_password"

# Logging
LOG_LEVEL=info
```

### 2. Production Environment
**File `.env` cho production:**
```env
# Database Configuration
USE_POSTGRES=true
USE_MONGO=true

# PostgreSQL Production Database
POSTGRES_DB=2tdata_postgres_prod
POSTGRES_USER=prod_postgres_user
POSTGRES_PASSWORD=very_secure_postgres_password
POSTGRES_HOST=prod_postgres_host
POSTGRES_PORT=5432

# MongoDB Production Database
DB_URI=mongodb://prod_user:secure_password@prod_mongodb_host:27017/2TDATA_PROD
MONGODB_URI=mongodb://prod_user:secure_password@prod_mongodb_host:27017/2TDATA_PROD

# Server Configuration
PORT=3004
NODE_ENV=production

# Authentication (QUAN TRỌNG: Thay đổi trong production)
SECRET_KEY="very_long_and_secure_secret_key_for_production_use_only_32_chars_min"
JWT_SECRET="very_long_and_secure_jwt_secret_key_for_production_use_only_32_chars_min"
JWT_EXPIRES_IN=24h

# Security
BCRYPT_SALT_ROUNDS=12

# Domain & CORS
MAIN_DOMAIN=yourdomain.com
DEFAULT_DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration
SEND_OTP_EMAIL="your_email@yourdomain.com"
SEND_OTP_EMAIL_PASSWORD="very_secure_email_password"

# Production Settings
DEBUG=false
VERBOSE_ERRORS=false
LOG_LEVEL=warn
TRUST_PROXY=true

# SSL/TLS (nếu sử dụng HTTPS)
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=20971520
UPLOAD_DIR=./uploads
```

## Các bước setup

### 1. Development Setup
```bash
# 1. Copy template
cp env-template.txt .env

# 2. Chỉnh sửa file .env với thông tin development
nano .env

# 3. Khởi động server
npm run dev
```

### 2. Production Setup
```bash
# 1. Tạo file .env cho production
touch .env

# 2. Copy nội dung production từ env-template.txt
# 3. Cập nhật tất cả giá trị production
# 4. Đảm bảo file .env không được commit vào Git
# 5. Deploy với PM2 hoặc Docker
```

## Bảo mật Production

### ⚠️ QUAN TRỌNG cho Production:
1. **Thay đổi tất cả passwords và secrets**
2. **Sử dụng JWT secret mạnh (ít nhất 32 ký tự)**
3. **Không commit file .env vào Git**
4. **Sử dụng HTTPS trong production**
5. **Cấu hình CORS origins chính xác**
6. **Setup logging và monitoring**
7. **Sử dụng database credentials riêng cho production**
8. **Cấu hình SSL certificates**
9. **Setup backup strategies**
10. **Cấu hình rate limiting phù hợp**

## Các biến môi trường quan trọng

### Bắt buộc:
- `PORT`: Port server chạy (3004)
- `NODE_ENV`: Môi trường (development/production)
- `USE_POSTGRES`: Sử dụng PostgreSQL (true/false)
- `USE_MONGO`: Sử dụng MongoDB (true/false)
- `DB_URI`: MongoDB connection string
- `SECRET_KEY`: Secret key cho JWT tokens
- `JWT_SECRET`: JWT secret key

### Tùy chọn:
- `POSTGRES_*`: PostgreSQL configuration
- `SEND_OTP_EMAIL`: Email configuration cho OTP
- `SEND_OTP_EMAIL_PASSWORD`: Email password
- `BCRYPT_SALT_ROUNDS`: Bcrypt salt rounds
- `JWT_EXPIRES_IN`: JWT expiration time
- `LOG_LEVEL`: Log level

## Troubleshooting

### Lỗi thường gặp:
1. **"Cannot connect to MongoDB"**: Kiểm tra `DB_URI`
2. **"JWT verification failed"**: Kiểm tra `JWT_SECRET`
3. **"CORS error"**: Kiểm tra `ALLOWED_ORIGINS`
4. **"Port already in use"**: Thay đổi `PORT`

### Kiểm tra environment:
```bash
# Kiểm tra biến môi trường
node -e "console.log(process.env.NODE_ENV)"

# Test database connection
npm run test:db

# Test server startup
npm run dev
```

## File structure
```
BE/
├── .env                    # Environment variables (không commit)
├── env-template.txt        # Template file (có thể commit)
├── ENVIRONMENT_SETUP.md    # Hướng dẫn này
└── src/
    └── app.js             # Load dotenv config
```
