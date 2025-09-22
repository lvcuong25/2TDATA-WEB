# Báo cáo sửa lỗi Copy Table/Database - 2TDATA-WEB

## Thông tin dự án
- **Backend**: Port 3004 (`/home/dbuser/2TDATA-WEB-dev/BE`)
- **Frontend**: Port 3006 (`/home/dbuser/2TDATA-WEB-dev/FE`)
- **URL Dev**: https://dev.2tdata.com
- **Tài khoản test**: superadmin@2tdata.com / admin123

## Vấn đề phát hiện

### 1. Formula không được copy
- **Nguyên nhân**: Hàm `copyTable` và `copyDatabase` không copy trường `formulaConfig` của column
- **File ảnh hưởng**: 
  - `/BE/src/controllers/tableController.js`
  - `/BE/src/controllers/databaseController.js`

### 2. Records bị duplicate khi copy
- **Nguyên nhân**: Logic copy records đặt sai vị trí trong vòng lặp columns
- **Ảnh hưởng**: Mỗi column được copy, records lại được copy một lần → duplicate data

### 3. Thiếu các thuộc tính column
- **Nguyên nhân**: Không copy đầy đủ các thuộc tính như format, precision, min, max, step, width, order

## Giải pháp đã áp dụng

### 1. Sửa hàm copyTable (tableController.js)
```javascript
// Thêm vào phần copy column:
formulaConfig: originalColumn.formulaConfig,
format: originalColumn.format,
precision: originalColumn.precision,
min: originalColumn.min,
max: originalColumn.max,
step: originalColumn.step,
width: originalColumn.width,
order: originalColumn.order
```

### 2. Sửa vị trí copy records
- Di chuyển logic copy records ra NGOÀI vòng lặp columns
- Đảm bảo records chỉ được copy 1 lần cho mỗi table

### 3. Sửa hàm copyDatabase (databaseController.js)
- Áp dụng cùng fix như copyTable cho tất cả tables trong database

## Files đã sửa
1. `/home/dbuser/2TDATA-WEB-dev/BE/src/controllers/tableController.js`
2. `/home/dbuser/2TDATA-WEB-dev/BE/src/controllers/databaseController.js`

## Files backup
- `tableController.js.backup_[timestamp]`
- Các file backup được tạo tự động trước khi sửa

## Testing
Để test chức năng copy đã sửa:

1. **Đăng nhập**: https://dev.2tdata.com với tài khoản superadmin@2tdata.com / admin123
2. **Test copy table**:
   - Vào bảng mẫu: https://dev.2tdata.com/database/68a80c41fc77d9db7dcbe224/table/68c6f671c471808d68fcf693
   - Thực hiện copy table
   - Kiểm tra bảng copy có đầy đủ:
     - Tất cả columns
     - Formula hoạt động
     - Data không bị duplicate

3. **Kiểm tra bảng đã copy trước đó**:
   - https://dev.2tdata.com/database/68c796f5fb0e0de32bdd2dcc/table/68c796f6fb0e0de32bdd2efb
   - Nếu vẫn thiếu → copy lại với code mới

## Lưu ý
- Backend cần restart để áp dụng thay đổi
- Nếu dùng PM2: `pm2 restart BE` hoặc `pm2 restart all`
- Nếu không dùng PM2: restart manual service Node.js

## Kết quả mong đợi
✅ Formula được copy đầy đủ
✅ Tất cả columns được copy
✅ Records không bị duplicate
✅ Các thuộc tính column (format, precision, etc.) được giữ nguyên

---
*Fix completed on: $(date)*
