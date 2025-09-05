# Sửa lỗi xóa dữ liệu cũ khi chuyển đổi loại cập nhật

## 🐛 Vấn đề

**"Ý là khi chuyển sang Chọn khoảng thời gian cập nhật thì sẽ phải xóa cái thời gian ngày giờ cũ đi chứ"**

User muốn khi chuyển từ "Lịch trình cố định" sang "Thời gian tùy chỉnh" thì phải **xóa sạch** thông tin lịch trình cũ (ngày, giờ) đi, không để nó còn hiển thị nữa.

## 🔍 Phân tích

### **1. Vấn đề trước đây:**
- Khi chuyển từ "Lịch trình cố định" sang "Thời gian tùy chỉnh"
- Dữ liệu cũ vẫn còn trong `autoUpdateSettings`
- "Thông tin hiện tại" vẫn hiển thị "Loại: Lịch trình cố định"
- Table vẫn hiển thị "Hàng ngày lúc 01:00"

### **2. Nguyên nhân:**
- Logic xóa dữ liệu cũ chỉ chạy khi **save**, không chạy khi **chọn radio button**
- `autoUpdateSettings` vẫn giữ dữ liệu cũ
- Logic hiển thị "Thông tin hiện tại" dựa vào `timeType` nhưng không kiểm tra dữ liệu có hợp lệ không

## ✅ Giải pháp

### **1. Xóa dữ liệu cũ ngay khi chọn radio button:**

```javascript
onChange={(e) => {
  const newTimeType = e.target.value;
  console.log('Changing timeType from', autoUpdateSettings.timeType, 'to', newTimeType);
  
  // Xóa dữ liệu cũ khi chuyển đổi loại
  if (newTimeType === 'schedule') {
    // Chuyển sang schedule -> xóa interval data
    setAutoUpdateSettings(prev => ({
      ...prev,
      timeType: newTimeType,
      interval: null,
      customValue: 30,
      customUnit: 'minutes'
    }));
  } else if (newTimeType === 'custom' || newTimeType === 'preset') {
    // Chuyển sang interval -> xóa schedule data
    setAutoUpdateSettings(prev => ({
      ...prev,
      timeType: newTimeType,
      scheduleType: null,
      scheduleTime: null,
      scheduleDate: null,
      scheduleDays: []
    }));
  } else {
    setAutoUpdateSettings(prev => ({ ...prev, timeType: newTimeType }));
  }
}}
```

### **2. Cải thiện logic hiển thị "Thông tin hiện tại":**

```javascript
// Kiểm tra xem có dữ liệu schedule hợp lệ không
const hasValidSchedule = autoUpdateSettings.timeType === 'schedule' && 
  autoUpdateSettings.scheduleType && 
  autoUpdateSettings.scheduleTime;

return hasValidSchedule ? (
  <>
    Loại: <Tag color="blue">Lịch trình cố định</Tag><br/>
    Lịch trình: {formatIntervalDisplay(...)}
  </>
) : (
  <>
    Loại: <Tag color="orange">Khoảng thời gian</Tag><br/>
    Khoảng thời gian: {formatIntervalDisplay(...)}
  </>
);
```

## 🎯 Kết quả mong đợi

### **Khi chọn "Thời gian tùy chỉnh" → "1 phút":**

**Trước:**
```
Console log:
- "Current info display - autoUpdateSettings: { timeType: 'custom', interval: 30, scheduleType: 'daily', scheduleTime: '01:00', ... }"

Thông tin hiện tại:
- Loại: [Lịch trình cố định] ❌ (sai)
- Lịch trình: Hàng ngày lúc 01:00 ❌ (sai)
```

**Sau:**
```
Console log:
- "Changing timeType from schedule to custom"
- "Current info display - autoUpdateSettings: { timeType: 'custom', interval: 30, scheduleType: null, scheduleTime: null, ... }"

Thông tin hiện tại:
- Loại: [Khoảng thời gian] ✅ (đúng)
- Khoảng thời gian: 1 phút ✅ (đúng)
```

### **Khi chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00":**

**Trước:**
```
Console log:
- "Current info display - autoUpdateSettings: { timeType: 'schedule', interval: 30, scheduleType: 'daily', scheduleTime: '01:00', ... }"

Thông tin hiện tại:
- Loại: [Khoảng thời gian] ❌ (sai)
- Khoảng thời gian: 30 phút ❌ (sai)
```

**Sau:**
```
Console log:
- "Changing timeType from custom to schedule"
- "Current info display - autoUpdateSettings: { timeType: 'schedule', interval: null, scheduleType: 'daily', scheduleTime: '08:00', ... }"

Thông tin hiện tại:
- Loại: [Lịch trình cố định] ✅ (đúng)
- Lịch trình: Hàng ngày lúc 08:00 ✅ (đúng)
```

## 🧪 Test Cases

### **Test 1: Schedule → Custom Time**
```
Action:
1. Mở cài đặt auto update
2. Chọn "Lịch trình cố định" → "Hàng ngày lúc 01:00"
3. Chọn "Thời gian tùy chỉnh" → "1 phút"
4. Kiểm tra console log:
   - "Changing timeType from schedule to custom"
   - "Current info display - autoUpdateSettings: { scheduleType: null, scheduleTime: null, ... }"
5. Kiểm tra "Thông tin hiện tại":
   - "Loại: Khoảng thời gian"
   - "Khoảng thời gian: 1 phút"

Expected: Hiển thị đúng "Khoảng thời gian", không còn dữ liệu schedule cũ
```

### **Test 2: Custom Time → Schedule**
```
Action:
1. Chọn "Thời gian tùy chỉnh" → "1 phút"
2. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00"
3. Kiểm tra console log:
   - "Changing timeType from custom to schedule"
   - "Current info display - autoUpdateSettings: { interval: null, ... }"
4. Kiểm tra "Thông tin hiện tại":
   - "Loại: Lịch trình cố định"
   - "Lịch trình: Hàng ngày lúc 08:00"

Expected: Hiển thị đúng "Lịch trình cố định", không còn dữ liệu interval cũ
```

### **Test 3: Table Display Update**
```
Action:
1. Chọn "Thời gian tùy chỉnh" → "1 phút"
2. Lưu cài đặt
3. Kiểm tra table "Cập nhật tự động":
   - Hiển thị "1 phút" thay vì "Hàng ngày lúc 01:00"

Expected: Table hiển thị đúng thời gian mới
```

## 🔧 Code Changes

### **File: `/FE/src/components/MyService.jsx`**

#### **1. Cập nhật Radio.Group onChange:**
```javascript
<Radio.Group
  value={autoUpdateSettings.timeType}
  onChange={(e) => {
    const newTimeType = e.target.value;
    console.log('Changing timeType from', autoUpdateSettings.timeType, 'to', newTimeType);
    
    // Xóa dữ liệu cũ khi chuyển đổi loại
    if (newTimeType === 'schedule') {
      // Chuyển sang schedule -> xóa interval data
      setAutoUpdateSettings(prev => ({
        ...prev,
        timeType: newTimeType,
        interval: null,
        customValue: 30,
        customUnit: 'minutes'
      }));
    } else if (newTimeType === 'custom' || newTimeType === 'preset') {
      // Chuyển sang interval -> xóa schedule data
      setAutoUpdateSettings(prev => ({
        ...prev,
        timeType: newTimeType,
        scheduleType: null,
        scheduleTime: null,
        scheduleDate: null,
        scheduleDays: []
      }));
    } else {
      setAutoUpdateSettings(prev => ({ ...prev, timeType: newTimeType }));
    }
  }}
  className="mb-3"
>
```

#### **2. Cải thiện logic hiển thị "Thông tin hiện tại":**
```javascript
// Kiểm tra xem có dữ liệu schedule hợp lệ không
const hasValidSchedule = autoUpdateSettings.timeType === 'schedule' && 
  autoUpdateSettings.scheduleType && 
  autoUpdateSettings.scheduleTime;

return hasValidSchedule ? (
  <>
    Loại: <Tag color="blue">Lịch trình cố định</Tag><br/>
    Lịch trình: {formatIntervalDisplay(...)}
  </>
) : (
  <>
    Loại: <Tag color="orange">Khoảng thời gian</Tag><br/>
    Khoảng thời gian: {formatIntervalDisplay(...)}
  </>
);
```

## 📊 So sánh

### **Trước:**
- ❌ Dữ liệu cũ không được xóa khi chọn radio button
- ❌ "Thông tin hiện tại" hiển thị sai
- ❌ Table hiển thị dữ liệu cũ
- ❌ User bối rối vì thấy dữ liệu không khớp

### **Sau:**
- ✅ Dữ liệu cũ được xóa ngay khi chọn radio button
- ✅ "Thông tin hiện tại" hiển thị đúng
- ✅ Table hiển thị dữ liệu mới
- ✅ User thấy rõ ràng dữ liệu đã thay đổi

## ✅ Kết quả

- ✅ **Xóa dữ liệu cũ** ngay khi chọn radio button
- ✅ **Hiển thị đúng** "Thông tin hiện tại"
- ✅ **Table cập nhật** đúng dữ liệu mới
- ✅ **User experience** tốt hơn, không bối rối

Bây giờ khi chuyển từ "Lịch trình cố định" sang "Thời gian tùy chỉnh", dữ liệu cũ sẽ được xóa sạch ngay lập tức! 🧹✨
