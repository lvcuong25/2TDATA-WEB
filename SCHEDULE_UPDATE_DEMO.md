# Demo: Chức năng Lịch trình Cập nhật Tự động

## 🎯 Tính năng mới: Lịch trình cố định

Thay vì cập nhật theo khoảng thời gian (mỗi 30 phút), giờ đây bạn có thể **chọn thời gian cụ thể** để hệ thống tự động cập nhật mà không cần ấn nút.

## 🚀 Các loại lịch trình

### 1. **Hàng ngày (Daily)**
- Cập nhật vào cùng một giờ mỗi ngày
- Ví dụ: "8:00 sáng mỗi ngày"

### 2. **Hàng tuần (Weekly)**
- Cập nhật vào cùng một giờ các ngày được chọn trong tuần
- Ví dụ: "9:00 sáng thứ 2, 4, 6"

### 3. **Hàng tháng (Monthly)**
- Cập nhật vào cùng một giờ mỗi tháng
- Ví dụ: "10:00 sáng ngày 1 mỗi tháng"

### 4. **Một lần duy nhất (Once)**
- Cập nhật vào thời gian cụ thể chỉ một lần
- Ví dụ: "14:00 ngày 25/12/2024"

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
│ ○ Thời gian tùy chỉnh               │
│ ● Lịch trình cố định                │
│                                     │
│ Loại lịch trình:                   │
│ [Select: Hàng ngày ▼]               │
│                                     │
│ Thời gian cập nhật:                 │
│ [TimePicker: 08:00 ▼]               │
│                                     │
│ Lịch trình: Hàng ngày lúc 08:00     │
│                                     │
│ Thông tin hiện tại:                │
│ ┌─────────────────────────────────┐ │
│ │ Trạng thái: [Đang bật]          │ │
│ │ Khoảng thời gian: Hàng ngày...  │ │
│ │ Cập nhật cuối: 14:30 25/12/2024 │ │
│ │ Cập nhật tiếp theo: 08:00...    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ • Hệ thống sẽ tự động gọi các link... │
│ • Chỉ áp dụng cho các dịch vụ...     │
│ • Thời gian có sẵn: Chọn từ...       │
│ • Thời gian tùy chỉnh: Nhập số...    │
│ • Lịch trình cố định: Cập nhật...    │
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

### Bước 2: Chọn "Lịch trình cố định"
- Chọn radio button "Lịch trình cố định"

### Bước 3: Cài đặt lịch trình
- **Loại lịch trình**: Chọn từ dropdown
- **Thời gian**: Chọn giờ:phút bằng TimePicker
- **Ngày** (nếu chọn "Một lần duy nhất"): Chọn ngày bằng DatePicker
- **Ngày trong tuần** (nếu chọn "Hàng tuần"): Chọn các ngày

### Bước 4: Lưu
- Click "Lưu" để áp dụng

## 📊 Ví dụ lịch trình

| Loại | Thời gian | Cài đặt | Kết quả |
|------|-----------|---------|---------|
| Hàng ngày | 08:00 | - | Cập nhật lúc 8:00 sáng mỗi ngày |
| Hàng tuần | 09:00 | Thứ 2, 4, 6 | Cập nhật lúc 9:00 sáng thứ 2, 4, 6 |
| Hàng tháng | 10:00 | - | Cập nhật lúc 10:00 sáng ngày 1 mỗi tháng |
| Một lần | 14:00 | 25/12/2024 | Cập nhật lúc 2:00 chiều ngày 25/12/2024 |

## 🎯 Tính năng nổi bật

### 1. **Linh hoạt**
- 4 loại lịch trình khác nhau
- Chọn thời gian chính xác đến phút
- Hỗ trợ chọn nhiều ngày trong tuần

### 2. **Trực quan**
- TimePicker để chọn giờ:phút
- DatePicker để chọn ngày
- Multi-select cho ngày trong tuần
- Preview lịch trình real-time

### 3. **Thông minh**
- Tự động tính thời gian cập nhật tiếp theo
- Validation input hợp lệ
- Không cho chọn ngày quá khứ (cho "Một lần")

### 4. **User-friendly**
- Hiển thị lịch trình rõ ràng
- Thông tin cập nhật cuối và tiếp theo
- Hướng dẫn chi tiết

## 🚀 Test Cases

### Test 1: Hàng ngày
```
Input: Hàng ngày lúc 08:00
Expected: Hiển thị "Hàng ngày lúc 08:00" trong bảng
Next Update: Ngày mai lúc 08:00
```

### Test 2: Hàng tuần
```
Input: Hàng tuần lúc 09:00, chọn Thứ 2, 4, 6
Expected: Hiển thị "Hàng tuần lúc 09:00" trong bảng
Next Update: Thứ 2, 4, hoặc 6 gần nhất lúc 09:00
```

### Test 3: Một lần
```
Input: Một lần lúc 14:00 ngày 25/12/2024
Expected: Hiển thị "Một lần lúc 14:00" trong bảng
Next Update: 25/12/2024 lúc 14:00 (nếu chưa qua)
```

### Test 4: Validation
```
Input: Một lần không chọn ngày
Expected: Hiển thị lỗi "Vui lòng chọn ngày cập nhật"
```

## 🔄 Luồng hoạt động

1. **Mở Modal** → Load cài đặt hiện tại
2. **Chọn "Lịch trình cố định"** → Hiển thị UI schedule
3. **Chọn loại lịch trình** → Hiển thị fields tương ứng
4. **Chọn thời gian** → Preview lịch trình
5. **Click Lưu** → Tính nextUpdateAt → Gửi API
6. **Refresh** → Hiển thị lịch trình mới

## 📝 Code Changes

### Frontend State mới:
```javascript
const [autoUpdateSettings, setAutoUpdateSettings] = useState({
  enabled: false,
  interval: 30,
  timeType: 'preset', // 'preset', 'custom', hoặc 'schedule'
  customValue: 30,
  customUnit: 'minutes',
  scheduleType: 'daily', // 'daily', 'weekly', 'monthly', 'once'
  scheduleTime: null, // moment object
  scheduleDate: null, // moment object (cho 'once')
  scheduleDays: [], // array các ngày trong tuần (cho 'weekly')
});
```

### Backend Model mới:
```javascript
autoUpdate: {
  enabled: Boolean,
  interval: Number,
  lastUpdateAt: Date,
  nextUpdateAt: Date,
  scheduleType: String, // 'daily', 'weekly', 'monthly', 'once'
  scheduleTime: String, // 'HH:mm'
  scheduleDate: String, // 'YYYY-MM-DD' (cho 'once')
  scheduleDays: [Number] // [0,1,2,3,4,5,6] (cho 'weekly')
}
```

### UI Components mới:
- `TimePicker` để chọn thời gian
- `DatePicker` để chọn ngày
- `Select` với `mode="multiple"` cho ngày trong tuần
- Preview lịch trình real-time

## ✅ Kết quả

Chức năng lịch trình cố định đã được triển khai với:
- ✅ 4 loại lịch trình (daily/weekly/monthly/once)
- ✅ TimePicker cho thời gian chính xác
- ✅ DatePicker cho ngày cụ thể
- ✅ Multi-select cho ngày trong tuần
- ✅ Validation và error handling
- ✅ Tính toán nextUpdateAt thông minh
- ✅ Hiển thị thông tin rõ ràng
- ✅ Tương thích với backend

## 🎉 Lợi ích

1. **Không cần ấn nút**: Hệ thống tự động cập nhật đúng giờ
2. **Linh hoạt**: Chọn thời gian phù hợp với lịch làm việc
3. **Chính xác**: Cập nhật đúng giờ đã đặt
4. **Tiện lợi**: Một lần cài đặt, hoạt động mãi mãi
5. **Kiểm soát**: Có thể tắt/bật bất kỳ lúc nào
