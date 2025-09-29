import fs from 'fs';

const envContent = `# Database Configuration
DB_URI=mongodb://admin:your_mongodb_password@localhost:27017/2TDATA?authSource=admin
MONGODB_URI=mongodb://admin:your_mongodb_password@localhost:27017/2TDATA?authSource=admin

# Hybrid Database Configuration
USE_POSTGRES=true
USE_MONGO=true

# PostgreSQL Configuration
POSTGRES_DB=2tdata_postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Server Configuration
PORT=3004
NODE_ENV=development

# JWT Configuration
SECRET_KEY="your_secret_key_here"
JWT_SECRET="your_secret_key_here"
JWT_EXPIRES_IN=24h

# Email Configuration
SEND_OTP_EMAIL="your_email_here"
SEND_OTP_EMAIL_PASSWORD="your_email_app_password"

# Logging
LOG_LEVEL=info

# Security
BCRYPT_SALT_ROUNDS=12

# Cloudinary Configuration (if needed)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Other configurations
CORS_ORIGIN=http://localhost:3000
`;

try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ File .env đã được tạo thành công!');
  console.log('📝 Vui lòng cập nhật các giá trị sau trong file .env:');
  console.log('   - MONGODB_URI: Cập nhật password MongoDB');
  console.log('   - JWT_SECRET: Cập nhật secret key');
  console.log('   - SEND_OTP_EMAIL: Cập nhật email');
  console.log('   - SEND_OTP_EMAIL_PASSWORD: Cập nhật email password');
  console.log('   - CLOUDINARY_*: Cập nhật thông tin Cloudinary nếu cần');
} catch (error) {
  console.error('❌ Lỗi khi tạo file .env:', error.message);
}
