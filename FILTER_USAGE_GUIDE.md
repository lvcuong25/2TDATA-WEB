# Hướng Dẫn Sử Dụng Filter Functionality

## 🎯 Tổng Quan

Chức năng filter đã được triển khai thành công cho TableDetail component. Bây giờ bạn có thể lọc dữ liệu bảng theo nhiều tiêu chí khác nhau.

## 🚀 Cách Sử Dụng

### 1. Khởi động ứng dụng
```bash
# Terminal 1 - Backend
cd BE && npm run dev

# Terminal 2 - Frontend  
cd FE && npm start
```

### 2. Truy cập vào bảng
- Đăng nhập vào hệ thống
- Chọn một database
- Chọn một table để xem chi tiết

### 3. Sử dụng Filter
1. **Mở Filter**: Click vào nút "Filter" trong toolbar (cạnh nút Group và Sort)
2. **Thêm Filter Rule**: Click "+ Add Filter Rule" để thêm điều kiện lọc
3. **Cấu hình Filter**:
   - **Field**: Chọn cột muốn lọc
   - **Operator**: Chọn toán tử so sánh
   - **Value**: Nhập giá trị cần lọc
4. **Kích hoạt Filter**: Check vào "Active" để áp dụng filter
5. **Xóa Filter**: Click nút delete (🗑️) để xóa filter rule

## 🔧 Các Toán Tử Filter

### Text Fields
- **is equal**: Bằng chính xác
- **is not equal**: Không bằng
- **is like**: Chứa chuỗi con (tương tự Contains)
- **is not like**: Không chứa chuỗi con
- **is blank**: Trống
- **is not blank**: Không trống

### Number Fields  
- **is equal**: Bằng chính xác
- **is not equal**: Không bằng
- **is greater than**: Lớn hơn
- **is less than**: Nhỏ hơn
- **is blank**: Trống
- **is not blank**: Không trống

### Date Fields
- **is equal**: Bằng chính xác
- **is not equal**: Không bằng
- **is after**: Sau ngày
- **is before**: Trước ngày
- **is blank**: Trống
- **is not blank**: Không trống

## 📊 Ví Dụ Sử Dụng

### Ví dụ 1: Lọc theo tên
```
Field: Name
Operator: is like  
Value: "john"
```
→ Hiển thị tất cả records có tên chứa "john"

### Ví dụ 2: Lọc theo tuổi
```
Field: Age
Operator: is greater than
Value: 25
```
→ Hiển thị tất cả records có tuổi > 25

### Ví dụ 3: Lọc theo ngày
```
Field: Created Date
Operator: is after
Value: 2024-01-01
```
→ Hiển thị tất cả records tạo sau 01/01/2024

## 🎨 Giao Diện

### Filter Button
- **Màu xám**: Chưa có filter rules
- **Màu xanh lá**: Có filter rules đang hoạt động
- **Số lượng**: Hiển thị số lượng filter rules (ví dụ: "Filter 1")

### Filter Dropdown
- **Header**: Tiêu đề "Filter" với checkbox "Active"
- **Filter Rules**: Mỗi rule có layout "Where [Field] [Operator] [Value] [Delete]"
- **Field Selection**: Dropdown với type indicators (T, N, D, B)
- **Operator Selection**: Dropdown với natural language labels
- **Value Input**: Input field với placeholder "Enter a value"
- **Add Button**: Nút "+ Add filter" để thêm rule mới

### Visual Indicators
- **Column highlighting**: Cột được filter sẽ có viền xanh
- **Filter indicator**: Chữ "F" nhỏ trên header cột được filter
- **Type indicators**: Chữ cái nhỏ (T, N, D, B) trong field dropdown

## 🔄 Tính Năng

### ✅ Đã Hoàn Thành
- [x] Thêm/xóa filter rules
- [x] Chọn field và operator
- [x] Nhập giá trị filter
- [x] Kích hoạt/vô hiệu hóa filter
- [x] Visual feedback
- [x] Click outside để đóng dropdown
- [x] Responsive design

### 🚧 Đang Phát Triển
- [ ] Lưu filter preferences vào database
- [ ] Load filter preferences khi mở bảng
- [ ] Advanced operators (OR logic, nested conditions)
- [ ] Filter templates
- [ ] Export filtered data

## 🐛 Troubleshooting

### Filter button không hiển thị
- Kiểm tra console để xem có lỗi JavaScript không
- Đảm bảo đã import FilterOutlined icon
- Kiểm tra CSS styles

### Filter không hoạt động
- Kiểm tra backend có đang chạy không
- Kiểm tra network tab để xem API calls
- Đảm bảo filter rules có đúng format

### Dropdown không mở
- Kiểm tra handleFilterButtonClick function
- Đảm bảo showFilterDropdown state được set đúng
- Kiểm tra z-index của dropdown

## 📝 Ghi Chú

- Filter rules được áp dụng với logic AND (tất cả điều kiện phải thỏa mãn)
- Filter chỉ hoạt động khi checkbox "Active" được check
- Có thể thêm nhiều filter rules cho cùng một bảng
- Filter rules sẽ được reset khi refresh trang (chưa có persistent storage)

## 🎉 Kết Luận

Filter functionality đã được triển khai thành công và sẵn sàng sử dụng. Tính năng này giúp người dùng dễ dàng lọc và tìm kiếm dữ liệu trong bảng một cách trực quan và hiệu quả.
