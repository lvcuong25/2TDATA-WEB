# Demo: Chức năng chọn thời gian linh hoạt cho Auto Update

## 🎯 Tính năng mới đã thêm

### 1. **Chọn thời gian có sẵn (Preset)**
- 5 phút, 10 phút, 15 phút, 30 phút
- 1 giờ, 2 giờ, 4 giờ, 8 giờ, 12 giờ, 24 giờ

### 2. **Chọn thời gian tùy chỉnh (Custom)**
- **Phút**: 1-999 phút
- **Giờ**: 1-999 giờ  
- **Ngày**: 1-999 ngày

## 🎨 Giao diện mới

### Modal cài đặt Auto Update:
```
┌─────────────────────────────────────┐
│ Cài đặt cập nhật tự động            │
├─────────────────────────────────────┤
│ Dịch vụ: [Tên dịch vụ]             │
│                                     │
│ Bật cập nhật tự động: [Switch]     │
│                                     │
│ Chọn khoảng thời gian cập nhật:     │
│ ○ Thời gian có sẵn                  │
│ ● Thời gian tùy chỉnh               │
│                                     │
│ [InputNumber] [Select: phút/giờ/ngày] │
│ Tổng thời gian: 2 giờ               │
│                                     │
│ Thông tin hiện tại:                │
│ ┌─────────────────────────────────┐ │
│ │ Trạng thái: [Đang bật]          │ │
│ │ Khoảng thời gian: 2 giờ         │ │
│ │ Cập nhật cuối: 14:30 25/12/2024 │ │
│ │ Cập nhật tiếp theo: 16:30...    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ • Hệ thống sẽ tự động gọi các link... │
│ • Chỉ áp dụng cho các dịch vụ...     │
│ • Bạn có thể chọn thời gian có sẵn... │
│ • Thời gian tùy chỉnh: từ 1 phút...  │
│ • Bạn có thể tắt bất kỳ lúc nào      │
│                                     │
│ [Hủy] [Lưu]                        │
└─────────────────────────────────────┘
```

## 🔧 Cách sử dụng

### Bước 1: Mở cài đặt
1. Vào trang "Dịch vụ của tôi"
2. Trong bảng "Danh sách dịch vụ"
3. Click icon ⚙️ ở cột "Cập nhật tự động"

### Bước 2: Chọn loại thời gian
- **Thời gian có sẵn**: Chọn từ dropdown có sẵn
- **Thời gian tùy chỉnh**: Nhập số + chọn đơn vị

### Bước 3: Cài đặt
- Bật/tắt Switch "Bật cập nhật tự động"
- Chọn thời gian phù hợp
- Click "Lưu"

## 📊 Ví dụ thời gian

| Nhập | Đơn vị | Kết quả hiển thị | Tổng phút |
|------|--------|------------------|-----------|
| 30   | phút   | 30 phút         | 30        |
| 2    | giờ    | 2 giờ           | 120       |
| 1    | ngày   | 1 ngày          | 1440      |
| 3    | ngày   | 3 ngày          | 4320      |

## 🎯 Tính năng nổi bật

### 1. **Linh hoạt**
- Chọn từ preset hoặc nhập custom
- Hỗ trợ 3 đơn vị: phút, giờ, ngày
- Hiển thị tổng thời gian real-time

### 2. **Trực quan**
- Radio button để chọn loại thời gian
- InputNumber với validation (1-999)
- Hiển thị tổng thời gian đã chọn

### 3. **Thông minh**
- Tự động detect loại thời gian khi mở modal
- Format hiển thị thông minh (phút/giờ/ngày)
- Validation input hợp lệ

### 4. **User-friendly**
- Hướng dẫn rõ ràng
- Hiển thị thông tin hiện tại
- Preview tổng thời gian

## 🚀 Test Cases

### Test 1: Thời gian có sẵn
```
Input: Chọn "1 giờ" từ dropdown
Expected: Hiển thị "Mỗi 1 giờ" trong bảng
```

### Test 2: Thời gian tùy chỉnh - phút
```
Input: 45 phút
Expected: Hiển thị "Mỗi 45 phút" trong bảng
```

### Test 3: Thời gian tùy chỉnh - giờ
```
Input: 3 giờ
Expected: Hiển thị "Mỗi 3 giờ" trong bảng
```

### Test 4: Thời gian tùy chỉnh - ngày
```
Input: 2 ngày
Expected: Hiển thị "Mỗi 2 ngày" trong bảng
```

### Test 5: Validation
```
Input: 0 phút
Expected: Tự động chuyển về 1 phút
```

## 🔄 Luồng hoạt động

1. **Mở Modal** → Load cài đặt hiện tại
2. **Chọn loại thời gian** → Hiển thị UI tương ứng
3. **Nhập thời gian** → Preview tổng thời gian
4. **Click Lưu** → Tính toán interval (phút) → Gửi API
5. **Refresh** → Hiển thị cài đặt mới

## 📝 Code Changes

### State mới:
```javascript
const [autoUpdateSettings, setAutoUpdateSettings] = useState({
  enabled: false,
  interval: 30,
  timeType: 'preset', // 'preset' hoặc 'custom'
  customValue: 30,
  customUnit: 'minutes' // 'minutes', 'hours', 'days'
});
```

### Function mới:
```javascript
const formatIntervalDisplay = (interval) => {
  if (interval >= 1440) {
    const days = Math.floor(interval / 1440);
    return `${days} ngày`;
  } else if (interval >= 60) {
    const hours = Math.floor(interval / 60);
    return `${hours} giờ`;
  } else {
    return `${interval} phút`;
  }
};
```

### UI Components mới:
- `Radio.Group` để chọn loại thời gian
- `InputNumber` để nhập số
- `Select` để chọn đơn vị
- Preview tổng thời gian

## ✅ Kết quả

Chức năng chọn thời gian đã được cải thiện với:
- ✅ 2 loại chọn thời gian (preset + custom)
- ✅ 3 đơn vị thời gian (phút/giờ/ngày)
- ✅ UI trực quan và dễ sử dụng
- ✅ Validation và error handling
- ✅ Hiển thị thông tin rõ ràng
- ✅ Tương thích với backend hiện tại
