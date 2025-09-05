# Sửa lỗi ReferenceError: isPreset is not defined

## 🐛 Lỗi

```
MyService.jsx:208 Uncaught ReferenceError: isPreset is not defined
    at handleOpenAutoUpdateModal (MyService.jsx:208:20)
    at Object.onClick (MyService.jsx:489:30)
```

## 🔍 Nguyên nhân

Khi xóa logic preset, tôi đã bỏ biến `isPreset` nhưng vẫn còn sử dụng nó ở dòng 208 trong `handleOpenAutoUpdateModal`:

```javascript
// Đã xóa biến này
const isPreset = presetOptions.includes(currentInterval);

// Nhưng vẫn sử dụng ở đây
customValue: isPreset ? 30 : (currentInterval >= 1440 ? Math.floor(currentInterval / 1440) : currentInterval >= 60 ? Math.floor(currentInterval / 60) : currentInterval),
```

## ✅ Giải pháp

### **Trước (có lỗi):**
```javascript
setAutoUpdateSettings({
  enabled: service.autoUpdate?.enabled || false,
  interval: currentInterval,
  timeType: timeType,
  customValue: isPreset ? 30 : (currentInterval >= 1440 ? Math.floor(currentInterval / 1440) : currentInterval >= 60 ? Math.floor(currentInterval / 60) : currentInterval),
  customUnit: currentInterval >= 1440 ? 'days' : currentInterval >= 60 ? 'hours' : 'minutes',
  scheduleType: service.autoUpdate?.scheduleType || 'daily',
  scheduleTime: service.autoUpdate?.scheduleTime ? dayjs(`2000-01-01 ${service.autoUpdate.scheduleTime}`) : null,
  scheduleDate: service.autoUpdate?.scheduleDate ? dayjs(service.autoUpdate.scheduleDate) : null,
  scheduleDays: service.autoUpdate?.scheduleDays || []
});
```

### **Sau (đã sửa):**
```javascript
setAutoUpdateSettings({
  enabled: service.autoUpdate?.enabled || false,
  interval: currentInterval,
  timeType: timeType,
  customValue: currentInterval >= 1440 ? Math.floor(currentInterval / 1440) : currentInterval >= 60 ? Math.floor(currentInterval / 60) : currentInterval,
  customUnit: currentInterval >= 1440 ? 'days' : currentInterval >= 60 ? 'hours' : 'minutes',
  scheduleType: service.autoUpdate?.scheduleType || 'daily',
  scheduleTime: service.autoUpdate?.scheduleTime ? dayjs(`2000-01-01 ${service.autoUpdate.scheduleTime}`) : null,
  scheduleDate: service.autoUpdate?.scheduleDate ? dayjs(service.autoUpdate.scheduleDate) : null,
  scheduleDays: service.autoUpdate?.scheduleDays || []
});
```

## 🎯 Thay đổi

### **Xóa logic `isPreset`:**
```javascript
// Trước
customValue: isPreset ? 30 : (currentInterval >= 1440 ? Math.floor(currentInterval / 1440) : currentInterval >= 60 ? Math.floor(currentInterval / 60) : currentInterval),

// Sau
customValue: currentInterval >= 1440 ? Math.floor(currentInterval / 1440) : currentInterval >= 60 ? Math.floor(currentInterval / 60) : currentInterval,
```

### **Logic mới:**
- **Không còn kiểm tra `isPreset`**
- **Luôn tính toán `customValue` dựa trên `currentInterval`**
- **Nếu `currentInterval >= 1440` (1 ngày):** `customValue = Math.floor(currentInterval / 1440)`
- **Nếu `currentInterval >= 60` (1 giờ):** `customValue = Math.floor(currentInterval / 60)`
- **Nếu `currentInterval < 60` (phút):** `customValue = currentInterval`

## 🧪 Test Cases

### **Test 1: Interval = 30 phút**
```
Input: currentInterval = 30
Expected: customValue = 30, customUnit = 'minutes'
```

### **Test 2: Interval = 120 phút (2 giờ)**
```
Input: currentInterval = 120
Expected: customValue = 2, customUnit = 'hours'
```

### **Test 3: Interval = 1440 phút (1 ngày)**
```
Input: currentInterval = 1440
Expected: customValue = 1, customUnit = 'days'
```

### **Test 4: Interval = 2880 phút (2 ngày)**
```
Input: currentInterval = 2880
Expected: customValue = 2, customUnit = 'days'
```

## ✅ Kết quả

- ✅ **Lỗi ReferenceError đã được sửa**
- ✅ **Không còn sử dụng biến `isPreset`**
- ✅ **Logic tính toán `customValue` vẫn hoạt động đúng**
- ✅ **Modal có thể mở được bình thường**
- ✅ **Không ảnh hưởng đến chức năng khác**

Bây giờ modal có thể mở được mà không bị lỗi! 🎯✨
