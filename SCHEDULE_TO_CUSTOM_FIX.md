# Sửa lỗi chuyển từ Lịch trình cố định sang Thời gian tùy chỉnh

## 🐛 Vấn đề

**"Từ lịch trình cố định sang thời gian tùy chỉnh k được à"**

Khi chuyển từ "Lịch trình cố định" sang "Thời gian tùy chỉnh", table vẫn hiển thị "Hàng ngày lúc 01:00" thay vì hiển thị thời gian tùy chỉnh đã chọn.

## 🔍 Nguyên nhân

### **1. Frontend logic xác định timeType sai:**
```javascript
// Trước (SAI)
let timeType = 'preset';
if (hasScheduleType) {
  timeType = 'schedule';  // ← Luôn ưu tiên schedule
} else if (isPreset) {
  timeType = 'preset';
} else {
  timeType = 'custom';
}
```

**Vấn đề**: Khi mở modal, nó luôn chọn "Lịch trình cố định" nếu có `scheduleType` trong database.

### **2. Backend không xử lý đúng null value:**
```javascript
// Trước (THIẾU)
if (scheduleType && scheduleType !== null) {
  // Xử lý schedule
}
```

**Vấn đề**: Không xử lý trường hợp `scheduleType === 'null'` (string).

## ✅ Giải pháp

### **1. Sửa Frontend logic xác định timeType:**
```javascript
// Sau (ĐÚNG)
let timeType = 'preset';
if (isPreset) {
  timeType = 'preset';  // ← Ưu tiên interval trước
} else if (hasScheduleType) {
  timeType = 'schedule';
} else {
  timeType = 'custom';
}
```

### **2. Sửa Backend xử lý null value:**
```javascript
// Sau (ĐÚNG)
if (scheduleType && scheduleType !== null && scheduleType !== 'null') {
  // Xử lý schedule
}

// Xóa thông tin schedule cũ
if (!scheduleType || scheduleType === null || scheduleType === 'null') {
  userService.autoUpdate.scheduleType = undefined;
  userService.autoUpdate.scheduleTime = undefined;
  userService.autoUpdate.scheduleDate = undefined;
  userService.autoUpdate.scheduleDays = undefined;
}
```

## 🎯 Kết quả

### **Trước khi sửa:**
```
1. Chọn "Lịch trình cố định" → "Hàng ngày lúc 01:00" → Lưu
2. Database: { scheduleType: 'daily', scheduleTime: '01:00' }
3. Mở modal → Luôn chọn "Lịch trình cố định" (vì có scheduleType)
4. Chọn "Thời gian tùy chỉnh" → "1 phút" → Lưu
5. Backend: Không xóa scheduleType (vì không xử lý đúng null)
6. Table: Vẫn hiển thị "Hàng ngày lúc 01:00" ❌
```

### **Sau khi sửa:**
```
1. Chọn "Lịch trình cố định" → "Hàng ngày lúc 01:00" → Lưu
2. Database: { scheduleType: 'daily', scheduleTime: '01:00' }
3. Mở modal → Chọn đúng loại hiện tại
4. Chọn "Thời gian tùy chỉnh" → "1 phút" → Lưu
5. Backend: Xóa scheduleType (xử lý đúng null)
6. Table: Hiển thị "1 phút" ✅
```

## 🔄 Luồng hoạt động mới

### **1. Schedule → Custom Time:**
```
Frontend: Gửi { interval: 1, scheduleType: null, ... }
Backend: Nhận scheduleType = null
Backend: if (null && null !== null && null !== 'null') → false
Backend: Xử lý interval, xóa schedule cũ
Database: { interval: 1, scheduleType: undefined }
Table: Hiển thị "1 phút"
```

### **2. Custom Time → Schedule:**
```
Frontend: Gửi { scheduleType: 'daily', scheduleTime: '08:00', ... }
Backend: Nhận scheduleType = 'daily'
Backend: if ('daily' && 'daily' !== null && 'daily' !== 'null') → true
Backend: Xử lý schedule, xóa interval cũ
Database: { scheduleType: 'daily', interval: undefined }
Table: Hiển thị "Hàng ngày lúc 08:00"
```

## 🧪 Test Cases

### **Test 1: Schedule → Custom Time**
```
Action:
1. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00" → Lưu
2. Kiểm tra table: "Hàng ngày lúc 08:00"
3. Mở modal → Chọn "Thời gian tùy chỉnh" → "1 phút" → Lưu
4. Kiểm tra console log:
   - Frontend: "Sending auto update request: { interval: 1, scheduleType: null }"
   - Backend: "Before save - autoUpdate: { scheduleType: 'daily', scheduleTime: '08:00' }"
   - Backend: "After save - autoUpdate: { interval: 1, scheduleType: undefined }"
5. Kiểm tra table: "1 phút"

Expected: Table hiển thị "1 phút"
```

### **Test 2: Custom Time → Schedule**
```
Action:
1. Chọn "Thời gian tùy chỉnh" → "2 giờ" → Lưu
2. Kiểm tra table: "2 giờ"
3. Mở modal → Chọn "Lịch trình cố định" → "Hàng tuần lúc 09:00" → Lưu
4. Kiểm tra table: "Hàng tuần lúc 09:00"

Expected: Table hiển thị "Hàng tuần lúc 09:00"
```

## 🔧 Code Changes

### **File: `/FE/src/components/MyService.jsx`**

#### **Sửa logic xác định timeType:**
```javascript
// Trước
if (hasScheduleType) {
  timeType = 'schedule';
} else if (isPreset) {
  timeType = 'preset';
} else {
  timeType = 'custom';
}

// Sau
if (isPreset) {
  timeType = 'preset';
} else if (hasScheduleType) {
  timeType = 'schedule';
} else {
  timeType = 'custom';
}
```

### **File: `/BE/src/controllers/userService.js`**

#### **Sửa xử lý null value:**
```javascript
// Trước
if (scheduleType && scheduleType !== null) {
  // Xử lý schedule
}

// Sau
if (scheduleType && scheduleType !== null && scheduleType !== 'null') {
  // Xử lý schedule
}
```

#### **Sửa xóa thông tin cũ:**
```javascript
// Trước
if (!scheduleType || scheduleType === null) {
  // Xóa schedule
}

// Sau
if (!scheduleType || scheduleType === null || scheduleType === 'null') {
  // Xóa schedule
}
```

## 📊 So sánh

### **Trước:**
- ❌ Frontend luôn ưu tiên schedule
- ❌ Backend không xử lý đúng null
- ❌ Không chuyển đổi được từ schedule sang custom

### **Sau:**
- ✅ Frontend ưu tiên interval trước
- ✅ Backend xử lý đúng null
- ✅ Chuyển đổi mượt mà giữa các loại

## ✅ Kết quả

- ✅ **Chuyển đổi được** từ "Lịch trình cố định" sang "Thời gian tùy chỉnh"
- ✅ **Table hiển thị đúng** theo lựa chọn
- ✅ **Không bị stuck** ở schedule
- ✅ **Trải nghiệm mượt mà** cho user

Bây giờ bạn có thể chuyển từ "Lịch trình cố định" sang "Thời gian tùy chỉnh" một cách bình thường! 🎯
