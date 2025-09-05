# Sửa lỗi chuyển đổi loại cập nhật

## 🐛 Vấn đề

Khi chọn loại cập nhật khác (ví dụ: từ "Lịch trình cố định" sang "Thời gian có sẵn"), phần "Thông tin hiện tại" vẫn hiển thị thông tin cũ thay vì thông tin mới.

**Ví dụ:**
- Chọn "Thời gian có sẵn" → "30 phút"
- Nhưng "Thông tin hiện tại" vẫn hiển thị "Lịch trình cố định"

## 🔍 Nguyên nhân

### 1. **Logic xác định timeType không đúng**
```javascript
// Trước (SAI)
const isSchedule = nextUpdate && service.autoUpdate?.scheduleType;
timeType: isSchedule ? 'schedule' : (isPreset ? 'preset' : 'custom')
```

**Vấn đề**: Ưu tiên `nextUpdate` thay vì `scheduleType`, dẫn đến xác định sai loại.

### 2. **Không xóa thông tin cũ khi chuyển đổi**
Khi chuyển từ schedule sang interval (hoặc ngược lại), thông tin cũ vẫn được giữ lại trong database.

## ✅ Giải pháp đã thực hiện

### 1. **Sửa logic xác định timeType**

**Trước:**
```javascript
const isSchedule = nextUpdate && service.autoUpdate?.scheduleType;
timeType: isSchedule ? 'schedule' : (isPreset ? 'preset' : 'custom')
```

**Sau:**
```javascript
// Kiểm tra xem có phải schedule không (dựa vào scheduleType)
const hasScheduleType = service.autoUpdate?.scheduleType;

// Xác định timeType: ưu tiên scheduleType trước
let timeType = 'preset'; // default
if (hasScheduleType) {
  timeType = 'schedule';
} else if (isPreset) {
  timeType = 'preset';
} else {
  timeType = 'custom';
}
```

### 2. **Thêm logic xóa thông tin cũ**

**Frontend:**
```javascript
if (autoUpdateSettings.timeType === 'schedule') {
  // Xử lý schedule
  requestData.scheduleType = autoUpdateSettings.scheduleType;
  requestData.scheduleTime = autoUpdateSettings.scheduleTime.format('HH:mm');
  // ...
  
  // Xóa thông tin interval cũ khi chuyển sang schedule
  requestData.clearInterval = true;
} else {
  // Xử lý interval (preset hoặc custom)
  requestData.interval = finalInterval;
  
  // Xóa thông tin schedule cũ khi chuyển sang interval
  requestData.clearSchedule = true;
}
```

**Backend:**
```javascript
if (scheduleType) {
  userService.autoUpdate.scheduleType = scheduleType;
  userService.autoUpdate.scheduleTime = scheduleTime;
  // ...
  
  // Xóa thông tin interval cũ nếu có
  if (clearInterval) {
    userService.autoUpdate.interval = undefined;
  }
} else {
  userService.autoUpdate.interval = interval;
  // ...
  
  // Xóa thông tin schedule cũ nếu có
  if (clearSchedule) {
    userService.autoUpdate.scheduleType = undefined;
    userService.autoUpdate.scheduleTime = undefined;
    userService.autoUpdate.scheduleDate = undefined;
    userService.autoUpdate.scheduleDays = undefined;
  }
}
```

## 🎯 Kết quả

### **Trước khi sửa:**
```
Chọn: "Thời gian có sẵn" → "30 phút"
Thông tin hiện tại:
┌─────────────────────────────────┐
│ Trạng thái: [Đang bật]          │
│ Loại: [Lịch trình cố định]      │ ← SAI: Vẫn hiển thị cũ
│ Lịch trình: Hàng ngày lúc 02:00 │ ← SAI: Vẫn hiển thị cũ
└─────────────────────────────────┘
```

### **Sau khi sửa:**
```
Chọn: "Thời gian có sẵn" → "30 phút"
Thông tin hiện tại:
┌─────────────────────────────────┐
│ Trạng thái: [Đang bật]          │
│ Loại: [Khoảng thời gian]        │ ← ĐÚNG: Hiển thị mới
│ Khoảng thời gian: 30 phút       │ ← ĐÚNG: Hiển thị mới
└─────────────────────────────────┘
```

## 🔄 Luồng hoạt động mới

### **1. Mở Modal:**
```
1. Kiểm tra scheduleType có tồn tại không
2. Nếu có → timeType = 'schedule'
3. Nếu không → kiểm tra interval có trong preset không
4. Nếu có → timeType = 'preset'
5. Nếu không → timeType = 'custom'
```

### **2. Chọn loại khác:**
```
1. User chọn radio button mới
2. UI cập nhật theo loại được chọn
3. Thông tin cũ vẫn hiển thị cho đến khi Save
```

### **3. Lưu cài đặt:**
```
1. Xác định loại cập nhật (schedule hoặc interval)
2. Gửi thông tin mới + flag xóa thông tin cũ
3. Backend xóa thông tin cũ và lưu thông tin mới
4. Refresh UI hiển thị thông tin mới
```

## 🧪 Test Cases

### **Test 1: Schedule → Preset**
```
Input: scheduleType = 'daily', scheduleTime = '02:00'
Action: Chọn "Thời gian có sẵn" → "30 phút"
Expected: 
- timeType = 'preset'
- Thông tin hiện tại: "Khoảng thời gian: 30 phút"
- Database: scheduleType = undefined, interval = 30
```

### **Test 2: Preset → Schedule**
```
Input: interval = 30
Action: Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00"
Expected:
- timeType = 'schedule'
- Thông tin hiện tại: "Lịch trình: Hàng ngày lúc 08:00"
- Database: interval = undefined, scheduleType = 'daily'
```

### **Test 3: Custom → Schedule**
```
Input: interval = 45 (custom)
Action: Chọn "Lịch trình cố định" → "Hàng tuần lúc 09:00"
Expected:
- timeType = 'schedule'
- Thông tin hiện tại: "Lịch trình: Hàng tuần lúc 09:00"
- Database: interval = undefined, scheduleType = 'weekly'
```

## ✅ Kết quả

- ✅ **Logic xác định timeType chính xác**
- ✅ **Xóa thông tin cũ khi chuyển đổi**
- ✅ **Hiển thị thông tin đúng với loại được chọn**
- ✅ **Database sạch sẽ, không có thông tin cũ**
- ✅ **UI responsive và chính xác**

Bây giờ khi bạn chọn loại cập nhật khác, thông tin sẽ thay đổi đúng theo lựa chọn! 🎯
