# Debug lỗi table hiển thị không đúng

## 🐛 Vấn đề

**"Kiểm tra lại table Cập nhật tự động khi tôi chọn chọn khoảng thời gian cập nhật thời gian tùy chỉnh thì table sẽ hiện thời gian tương ứng tôi chọn chứ k phải cố định như kia"**

Trong ảnh, user chọn "Thời gian tùy chỉnh" nhưng table vẫn hiển thị "Hàng ngày lúc 01:00" thay vì hiển thị thời gian tùy chỉnh đã chọn.

## 🔍 Phân tích

### **1. Table sử dụng data từ database:**
```javascript
// Trong cột "Cập nhật tự động"
{record.autoUpdate?.enabled ? formatIntervalDisplay(
  record.autoUpdate.interval,      // ← Data từ database
  record.autoUpdate.scheduleType,  // ← Data từ database
  record.autoUpdate.scheduleTime   // ← Data từ database
) : "Tắt"}
```

**Vấn đề**: Nếu backend không cập nhật đúng database, table sẽ hiển thị thông tin cũ.

### **2. Function formatIntervalDisplay ưu tiên scheduleType:**
```javascript
// Logic hiện tại
if (scheduleType && scheduleType !== null && scheduleType !== undefined) {
  // Hiển thị schedule
} else {
  // Hiển thị interval
}
```

**Vấn đề**: Nếu `scheduleType` vẫn còn trong database, function sẽ hiển thị schedule thay vì interval.

## ✅ Giải pháp

### **1. Thêm debug log chi tiết:**
```javascript
// Trong table render
console.log('Table display data for service:', record.service?.name, {
  interval: record.autoUpdate.interval,
  scheduleType: record.autoUpdate.scheduleType,
  scheduleTime: record.autoUpdate.scheduleTime,
  enabled: record.autoUpdate.enabled
});

const displayText = formatIntervalDisplay(
  record.autoUpdate.interval, 
  record.autoUpdate.scheduleType, 
  record.autoUpdate.scheduleTime
);

console.log('Formatted display text:', displayText);
```

### **2. Debug function formatIntervalDisplay:**
```javascript
const formatIntervalDisplay = (interval, scheduleType, scheduleTime) => {
  console.log('formatIntervalDisplay called with:', { interval, scheduleType, scheduleTime });
  
  if (scheduleType && scheduleType !== null && scheduleType !== undefined) {
    console.log('Using scheduleType logic:', scheduleType);
    // ... schedule logic
  }
  
  console.log('Using interval logic:', interval);
  // ... interval logic
};
```

## 🎯 Kết quả mong đợi

### **Khi chọn "Thời gian tùy chỉnh" → "1 phút":**
```
Console log:
- "Table display data for service: Facebook Automation { interval: 1, scheduleType: undefined, scheduleTime: undefined }"
- "formatIntervalDisplay called with: { interval: 1, scheduleType: undefined, scheduleTime: undefined }"
- "Using interval logic: 1"
- "Returning minutes: 1"
- "Formatted display text: 1 phút"

Table hiển thị: "1 phút" ✅
```

### **Khi chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00":**
```
Console log:
- "Table display data for service: Facebook Automation { interval: undefined, scheduleType: 'daily', scheduleTime: '08:00' }"
- "formatIntervalDisplay called with: { interval: undefined, scheduleType: 'daily', scheduleTime: '08:00' }"
- "Using scheduleType logic: daily"
- "Formatted display text: Hàng ngày lúc 08:00"

Table hiển thị: "Hàng ngày lúc 08:00" ✅
```

## 🧪 Test Cases

### **Test 1: Custom Time → Table Display**
```
Action:
1. Mở Developer Tools (F12 → Console)
2. Chọn "Thời gian tùy chỉnh" → "1 phút" → Lưu
3. Kiểm tra console log:
   - "Table display data for service: ... { interval: 1, scheduleType: undefined }"
   - "Using interval logic: 1"
   - "Returning minutes: 1"
4. Kiểm tra table hiển thị: "1 phút"

Expected: Table hiển thị "1 phút"
```

### **Test 2: Schedule → Table Display**
```
Action:
1. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00" → Lưu
2. Kiểm tra console log:
   - "Table display data for service: ... { interval: undefined, scheduleType: 'daily' }"
   - "Using scheduleType logic: daily"
3. Kiểm tra table hiển thị: "Hàng ngày lúc 08:00"

Expected: Table hiển thị "Hàng ngày lúc 08:00"
```

## 🔧 Code Changes

### **File: `/FE/src/components/MyService.jsx`**

#### **1. Thêm debug log trong table render:**
```javascript
{record.autoUpdate?.enabled ? (() => {
  console.log('Table display data for service:', record.service?.name, {
    interval: record.autoUpdate.interval,
    scheduleType: record.autoUpdate.scheduleType,
    scheduleTime: record.autoUpdate.scheduleTime,
    enabled: record.autoUpdate.enabled
  });
  
  const displayText = formatIntervalDisplay(
    record.autoUpdate.interval, 
    record.autoUpdate.scheduleType, 
    record.autoUpdate.scheduleTime
  );
  
  console.log('Formatted display text:', displayText);
  return displayText;
})() : "Tắt"}
```

#### **2. Thêm debug log trong formatIntervalDisplay:**
```javascript
const formatIntervalDisplay = (interval, scheduleType, scheduleTime) => {
  console.log('formatIntervalDisplay called with:', { interval, scheduleType, scheduleTime });
  
  if (scheduleType && scheduleType !== null && scheduleType !== undefined) {
    console.log('Using scheduleType logic:', scheduleType);
    // ... schedule logic
  }
  
  console.log('Using interval logic:', interval);
  // ... interval logic
};
```

## 📊 So sánh

### **Trước:**
- ❌ Không có debug log
- ❌ Không biết data từ database như thế nào
- ❌ Không biết function formatIntervalDisplay hoạt động ra sao

### **Sau:**
- ✅ Có debug log chi tiết
- ✅ Biết chính xác data từ database
- ✅ Biết function formatIntervalDisplay hoạt động như thế nào
- ✅ Có thể xác định nguyên nhân chính xác

## ✅ Kết quả

- ✅ **Debug log chi tiết** giúp xác định nguyên nhân
- ✅ **Biết chính xác** data từ database
- ✅ **Biết chính xác** function formatIntervalDisplay hoạt động
- ✅ **Có thể sửa** vấn đề chính xác

Bây giờ debug log sẽ giúp xác định chính xác tại sao table không hiển thị đúng! 🔍
