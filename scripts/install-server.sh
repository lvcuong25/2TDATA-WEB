#!/bin/bash

# Script tự động cài đặt và cấu hình server cho 2TDATA
# Chạy với quyền sudo

set -e

echo "🚀 Bắt đầu cài đặt server cho 2TDATA..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Không chạy script này với quyền root. Hãy chạy với user thường có sudo."
   exit 1
fi

# Update system
print_status "Cập nhật hệ thống..."
sudo apt update && sudo apt upgrade -y

# Install basic dependencies
print_status "Cài đặt dependencies cơ bản..."
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 18
print_status "Cài đặt Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js version: $node_version"
print_status "NPM version: $npm_version"

# Install MongoDB 6.0
print_status "Cài đặt MongoDB 6.0..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
print_status "Khởi động MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
print_status "Cài đặt Nginx..."
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
print_status "Cài đặt PM2..."
sudo npm install -g pm2

# Configure firewall
print_status "Cấu hình firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw deny 27017
sudo ufw --force enable

# Create application directory
print_status "Tạo thư mục ứng dụng..."
sudo mkdir -p /var/www/2tdata
sudo chown $USER:$USER /var/www/2tdata

# Create backup directory
sudo mkdir -p /var/backups/2tdata
sudo chown $USER:$USER /var/backups/2tdata

print_status "✅ Cài đặt server hoàn tất!"
print_warning "Tiếp theo:"
echo "1. Upload source code vào /var/www/2tdata"
echo "2. Chạy script setup-database.sh để cấu hình MongoDB"
echo "3. Chạy script deploy-app.sh để triển khai ứng dụng"
