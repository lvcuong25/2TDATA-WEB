# Sửa lỗi chuyển đổi giữa Schedule và Interval

## 🐛 Vấn đề

**"Khi chuyển sang thời gian khác thì cũng thay đổi chứ sao lại ăn theo cái lịch trình cố định suốt"**

Khi chuyển từ "Lịch trình cố định" sang "Thời gian tùy chỉnh" (hoặc ngược lại), hệ thống vẫn "ăn theo" lịch trình cố định cũ thay vì chuyển đổi đúng.

## 🔍 Nguyên nhân

### **1. Frontend không gửi đầy đủ thông tin xóa:**
```javascript
// Trước (THIẾU)
requestData = {
  interval: 1,
  clearSchedule: true
  // Thiếu: scheduleType, scheduleTime, scheduleDate, scheduleDays
}
```

**Vấn đề**: Backend vẫn thấy `scheduleType` từ state cũ, nên nghĩ đây là schedule.

### **2. Backend logic xóa không đủ mạnh:**
```javascript
// Backend chỉ xóa khi có clearSchedule flag
if (clearSchedule) {
  userService.autoUpdate.scheduleType = undefined;
  // ...
}
```

**Vấn đề**: Nếu frontend không gửi đúng flag, backend không xóa.

## ✅ Giải pháp

### **1. Frontend gửi đầy đủ thông tin xóa:**

#### **Khi chuyển sang Interval:**
```javascript
// Sau (ĐẦY ĐỦ)
requestData = {
  interval: 1,
  clearSchedule: true,
  scheduleType: null,        // ← Thêm
  scheduleTime: null,        // ← Thêm
  scheduleDate: null,        // ← Thêm
  scheduleDays: null         // ← Thêm
}
```

#### **Khi chuyển sang Schedule:**
```javascript
// Sau (ĐẦY ĐỦ)
requestData = {
  scheduleType: 'daily',
  scheduleTime: '08:00',
  clearInterval: true,
  interval: null             // ← Thêm
}
```

### **2. Backend xóa mạnh mẽ hơn:**
```javascript
// Xóa thông tin schedule cũ khi chuyển sang interval
if (!scheduleType) {
  userService.autoUpdate.scheduleType = undefined;
  userService.autoUpdate.scheduleTime = undefined;
  userService.autoUpdate.scheduleDate = undefined;
  userService.autoUpdate.scheduleDays = undefined;
}
```

## 🎯 Kết quả

### **Trước khi sửa:**
```
Chọn: "Thời gian tùy chỉnh" → "1 phút" → Lưu
Backend nhận: { interval: 1, clearSchedule: true }
Backend nghĩ: "Có scheduleType cũ, đây là schedule"
Kết quả: Table hiển thị "Hàng ngày lúc 01:00" ❌
```

### **Sau khi sửa:**
```
Chọn: "Thời gian tùy chỉnh" → "1 phút" → Lưu
Backend nhận: { 
  interval: 1, 
  clearSchedule: true,
  scheduleType: null,
  scheduleTime: null,
  scheduleDate: null,
  scheduleDays: null
}
Backend nghĩ: "scheduleType = null, đây là interval"
Kết quả: Table hiển thị "1 phút" ✅
```

## 🔄 Luồng hoạt động mới

### **1. Schedule → Interval:**
```
Frontend: Gửi { interval: 1, scheduleType: null, ... }
Backend: Nhận scheduleType = null → Xóa schedule → Lưu interval
Table: Hiển thị "1 phút"
```

### **2. Interval → Schedule:**
```
Frontend: Gửi { scheduleType: 'daily', interval: null, ... }
Backend: Nhận interval = null → Xóa interval → Lưu schedule
Table: Hiển thị "Hàng ngày lúc 08:00"
```

### **3. Preset → Custom:**
```
Frontend: Gửi { interval: 120, scheduleType: null, ... }
Backend: Nhận scheduleType = null → Xóa schedule → Lưu interval
Table: Hiển thị "2 giờ"
```

## 🧪 Test Cases

### **Test 1: Schedule → Custom Time**
```
Action:
1. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00" → Lưu
2. Kiểm tra table: "Hàng ngày lúc 08:00"
3. Chọn "Thời gian tùy chỉnh" → "1 phút" → Lưu
4. Kiểm tra table: "1 phút"

Expected: Table chuyển đổi đúng
```

### **Test 2: Custom Time → Schedule**
```
Action:
1. Chọn "Thời gian tùy chỉnh" → "2 giờ" → Lưu
2. Kiểm tra table: "2 giờ"
3. Chọn "Lịch trình cố định" → "Hàng tuần lúc 09:00" → Lưu
4. Kiểm tra table: "Hàng tuần lúc 09:00"

Expected: Table chuyển đổi đúng
```

### **Test 3: Preset → Schedule**
```
Action:
1. Chọn "Thời gian có sẵn" → "30 phút" → Lưu
2. Kiểm tra table: "30 phút"
3. Chọn "Lịch trình cố định" → "Hàng tháng lúc 10:00" → Lưu
4. Kiểm tra table: "Hàng tháng lúc 10:00"

Expected: Table chuyển đổi đúng
```

## 🔧 Code Changes

### **File: `/FE/src/components/MyService.jsx`**

#### **Khi chuyển sang Schedule:**
```javascript
// Trước
requestData.clearInterval = true;

// Sau
requestData.clearInterval = true;
requestData.interval = null;
```

#### **Khi chuyển sang Interval:**
```javascript
// Trước
requestData.clearSchedule = true;

// Sau
requestData.clearSchedule = true;
requestData.scheduleType = null;
requestData.scheduleTime = null;
requestData.scheduleDate = null;
requestData.scheduleDays = null;
```

## 📊 So sánh

### **Trước:**
- ❌ Frontend gửi thiếu thông tin xóa
- ❌ Backend không xóa đúng
- ❌ Table "ăn theo" thông tin cũ
- ❌ Chuyển đổi không hoạt động

### **Sau:**
- ✅ Frontend gửi đầy đủ thông tin xóa
- ✅ Backend xóa đúng thông tin cũ
- ✅ Table hiển thị đúng thông tin mới
- ✅ Chuyển đổi hoạt động mượt mà

## ✅ Kết quả

- ✅ **Chuyển đổi đúng** giữa các loại cập nhật
- ✅ **Không "ăn theo"** thông tin cũ
- ✅ **Table hiển thị chính xác** theo lựa chọn
- ✅ **Trải nghiệm mượt mà** cho user

Bây giờ khi chuyển sang thời gian khác, nó sẽ thay đổi đúng thay vì "ăn theo" lịch trình cố định! 🎯
