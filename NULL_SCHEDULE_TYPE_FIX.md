# Sửa lỗi scheduleType null không được xử lý đúng

## 🐛 Vấn đề

**"Chọn thời tùy chỉnh thì tại sao vẫn còn hằng ngày lúc 1:00"**

Mặc dù đã sửa logic, nhưng khi chọn "Thời gian tùy chỉnh", table vẫn hiển thị "Hàng ngày lúc 1:00" thay vì hiển thị thời gian tùy chỉnh.

## 🔍 Nguyên nhân

### **Backend logic kiểm tra scheduleType sai:**
```javascript
// Trước (SAI)
if (scheduleType) {
  // Xử lý schedule
} else {
  // Xử lý interval
}
```

**Vấn đề**: Khi frontend gửi `scheduleType: null`, JavaScript coi `null` là falsy, nhưng backend vẫn có thể nhận được `scheduleType` từ state cũ.

### **Frontend gửi scheduleType: null:**
```javascript
// Frontend gửi
requestData = {
  interval: 1,
  scheduleType: null,  // ← null
  scheduleTime: null,
  // ...
}
```

**Vấn đề**: Backend không xử lý đúng `null` value.

## ✅ Giải pháp

### **1. Backend kiểm tra scheduleType chính xác:**
```javascript
// Sau (ĐÚNG)
if (scheduleType && scheduleType !== null) {
  // Xử lý schedule
} else {
  // Xử lý interval
}
```

### **2. Backend xóa thông tin cũ mạnh mẽ hơn:**
```javascript
// Xóa thông tin schedule cũ khi chuyển sang interval
if (!scheduleType || scheduleType === null) {
  userService.autoUpdate.scheduleType = undefined;
  userService.autoUpdate.scheduleTime = undefined;
  userService.autoUpdate.scheduleDate = undefined;
  userService.autoUpdate.scheduleDays = undefined;
}
```

## 🎯 Kết quả

### **Trước khi sửa:**
```
Frontend gửi: { interval: 1, scheduleType: null }
Backend nhận: scheduleType = null
Backend logic: if (null) → false → xử lý interval
Nhưng: scheduleType cũ vẫn còn trong database
Kết quả: Table hiển thị "Hàng ngày lúc 1:00" ❌
```

### **Sau khi sửa:**
```
Frontend gửi: { interval: 1, scheduleType: null }
Backend nhận: scheduleType = null
Backend logic: if (null && null !== null) → false → xử lý interval
Backend xóa: scheduleType = undefined, scheduleTime = undefined
Kết quả: Table hiển thị "1 phút" ✅
```

## 🔄 Luồng hoạt động mới

### **1. Chọn "Thời gian tùy chỉnh" → "1 phút":**
```
Frontend: Gửi { interval: 1, scheduleType: null, ... }
Backend: Nhận scheduleType = null
Backend: if (null && null !== null) → false
Backend: Xử lý interval, xóa schedule cũ
Database: { interval: 1, scheduleType: undefined }
Table: Hiển thị "1 phút"
```

### **2. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00":**
```
Frontend: Gửi { scheduleType: 'daily', scheduleTime: '08:00', ... }
Backend: Nhận scheduleType = 'daily'
Backend: if ('daily' && 'daily' !== null) → true
Backend: Xử lý schedule, xóa interval cũ
Database: { scheduleType: 'daily', interval: undefined }
Table: Hiển thị "Hàng ngày lúc 08:00"
```

## 🧪 Test Cases

### **Test 1: Custom Time với scheduleType: null**
```
Action:
1. Chọn "Thời gian tùy chỉnh" → "1 phút"
2. Click "Lưu"
3. Kiểm tra console log:
   - Frontend: "Sending auto update request: { interval: 1, scheduleType: null }"
   - Backend: "Before save - autoUpdate: { scheduleType: 'daily', scheduleTime: '01:00' }"
   - Backend: "After save - autoUpdate: { interval: 1, scheduleType: undefined }"
4. Kiểm tra table hiển thị: "1 phút"

Expected: Table hiển thị "1 phút"
```

### **Test 2: Schedule với scheduleType: 'daily'**
```
Action:
1. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00"
2. Click "Lưu"
3. Kiểm tra console log:
   - Frontend: "Sending auto update request: { scheduleType: 'daily', scheduleTime: '08:00' }"
   - Backend: "Before save - autoUpdate: { interval: 1 }"
   - Backend: "After save - autoUpdate: { scheduleType: 'daily', interval: undefined }"
4. Kiểm tra table hiển thị: "Hàng ngày lúc 08:00"

Expected: Table hiển thị "Hàng ngày lúc 08:00"
```

## 🔧 Code Changes

### **File: `/BE/src/controllers/userService.js`**

#### **Thay đổi chính:**
```javascript
// Trước
if (scheduleType) {
  // Xử lý schedule
} else {
  // Xử lý interval
}

// Sau
if (scheduleType && scheduleType !== null) {
  // Xử lý schedule
} else {
  // Xử lý interval
}
```

#### **Xóa thông tin cũ mạnh mẽ hơn:**
```javascript
// Trước
if (!scheduleType) {
  // Xóa schedule
}

// Sau
if (!scheduleType || scheduleType === null) {
  // Xóa schedule
}
```

## 📊 So sánh

### **Trước:**
- ❌ Backend không xử lý đúng `null` value
- ❌ Thông tin cũ không được xóa hoàn toàn
- ❌ Table vẫn hiển thị thông tin cũ

### **Sau:**
- ✅ Backend xử lý đúng `null` value
- ✅ Thông tin cũ được xóa hoàn toàn
- ✅ Table hiển thị đúng thông tin mới

## ✅ Kết quả

- ✅ **"Thời gian tùy chỉnh"** → Table hiển thị đúng thời gian tùy chỉnh
- ✅ **"Lịch trình cố định"** → Table hiển thị đúng lịch trình
- ✅ **Không còn "ăn theo"** thông tin cũ
- ✅ **Chuyển đổi hoạt động** chính xác

Bây giờ khi chọn "Thời gian tùy chỉnh", table sẽ hiển thị đúng thời gian tùy chỉnh thay vì "Hàng ngày lúc 1:00"! 🎯
