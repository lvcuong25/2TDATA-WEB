# Hướng dẫn thiết lập Auto Update Service

## Tổng quan
Chức năng Auto Update cho phép hệ thống tự động gọi các link cập nhật của dịch vụ theo khoảng thời gian đã cài đặt.

## Cài đặt

### 1. Backend đã được cập nhật
- Model `UserService` đã thêm field `autoUpdate`
- API endpoints mới:
  - `PUT /userService/:id/auto-update` - Cập nhật cài đặt auto update
  - `GET /userService/auto-update/list` - Lấy danh sách service cần cập nhật
  - `PUT /userService/:id/update-time` - Cập nhật thời gian cập nhật cuối cùng

### 2. Frontend đã được cập nhật
- Thêm UI để cài đặt auto update trong MyService component
- Modal cài đặt với các tùy chọn thời gian: 5 phút, 10 phút, 15 phút, 30 phút, 1 giờ, 2 giờ, 4 giờ, 8 giờ, 12 giờ, 24 giờ

### 3. Script Auto Update
Script `src/scripts/autoUpdateService.js` đã được tạo để thực hiện cập nhật tự động.

## Thiết lập Cron Job

### Cách 1: Sử dụng crontab (Linux/Mac)

1. Mở crontab editor:
```bash
crontab -e
```

2. Thêm dòng sau để chạy mỗi 5 phút:
```bash
# Chạy auto update mỗi 5 phút
*/5 * * * * cd /path/to/your/project/BE && npm run auto-update >> /var/log/auto-update.log 2>&1
```

3. Hoặc chạy mỗi 10 phút:
```bash
# Chạy auto update mỗi 10 phút
*/10 * * * * cd /path/to/your/project/BE && npm run auto-update >> /var/log/auto-update.log 2>&1
```

### Cách 2: Sử dụng PM2 (Khuyến nghị cho production)

1. Cài đặt PM2 nếu chưa có:
```bash
npm install -g pm2
```

2. Tạo file ecosystem config cho auto update:
```javascript
// ecosystem.auto-update.config.js
module.exports = {
  apps: [{
    name: 'auto-update-service',
    script: 'src/scripts/autoUpdateService.js',
    cwd: '/path/to/your/project/BE',
    cron_restart: '*/5 * * * *', // Chạy mỗi 5 phút
    autorestart: false,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. Chạy với PM2:
```bash
pm2 start ecosystem.auto-update.config.js
pm2 save
pm2 startup
```

### Cách 3: Sử dụng Docker với cron

Tạo file `Dockerfile.auto-update`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Cài đặt cron
RUN apk add --no-cache dcron

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Tạo script cron
RUN echo "*/5 * * * * cd /app && npm run auto-update >> /var/log/auto-update.log 2>&1" > /etc/crontabs/root

# Chạy cron
CMD ["crond", "-f"]
```

## Cách sử dụng

### 1. Cài đặt Auto Update cho dịch vụ
1. Vào trang "Dịch vụ của tôi"
2. Trong bảng "Danh sách dịch vụ", click vào icon ⚙️ ở cột "Cập nhật tự động"
3. Chọn bật/tắt và khoảng thời gian cập nhật
4. Click "Lưu"

### 2. Theo dõi trạng thái
- Trong bảng sẽ hiển thị trạng thái auto update (bật/tắt)
- Hiển thị thời gian cập nhật tiếp theo
- Tag màu xanh khi đang bật, màu xám khi tắt

## Lưu ý quan trọng

1. **Chỉ áp dụng cho dịch vụ có link_update**: Hệ thống chỉ tự động cập nhật các dịch vụ có ít nhất 1 link cập nhật.

2. **Thời gian cập nhật**: Hệ thống sẽ tính toán thời gian cập nhật tiếp theo dựa trên thời gian cập nhật cuối cùng + khoảng thời gian đã cài đặt.

3. **Logging**: Tất cả hoạt động auto update sẽ được ghi log để theo dõi.

4. **Error handling**: Nếu một link cập nhật bị lỗi, hệ thống sẽ tiếp tục với các link khác và ghi log lỗi.

5. **Performance**: Cron job nên chạy với tần suất phù hợp (khuyến nghị 5-10 phút) để tránh tải quá nặng.

## Troubleshooting

### Kiểm tra log
```bash
# Xem log cron job
tail -f /var/log/auto-update.log

# Xem log PM2
pm2 logs auto-update-service
```

### Kiểm tra trạng thái PM2
```bash
pm2 status
pm2 monit
```

### Test script thủ công
```bash
cd BE
npm run auto-update
```

## API Endpoints

### Cập nhật cài đặt auto update
```
PUT /userService/:id/auto-update
Body: {
  "enabled": true,
  "interval": 30
}
```

### Lấy danh sách service cần cập nhật
```
GET /userService/auto-update/list
```

### Cập nhật thời gian cập nhật cuối cùng
```
PUT /userService/:id/update-time
```
