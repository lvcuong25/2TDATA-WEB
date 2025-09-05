# Bỏ tùy chọn "Thời gian có sẵn" khỏi auto update

## 🎯 Yêu cầu

**"Bỏ thời gian có sẵn đi"**

User muốn bỏ tùy chọn "Thời gian có sẵn" khỏi modal cài đặt auto update, chỉ giữ lại:
- **Thời gian tùy chỉnh** (custom)
- **Lịch trình cố định** (schedule)

## 🔧 Thay đổi đã thực hiện

### **1. Xóa radio button "Thời gian có sẵn":**

**Trước:**
```javascript
<Radio.Group>
  <Radio value="preset">Thời gian có sẵn</Radio>
  <Radio value="custom">Thời gian tùy chỉnh</Radio>
  <Radio value="schedule">Lịch trình cố định</Radio>
</Radio.Group>
```

**Sau:**
```javascript
<Radio.Group>
  <Radio value="custom">Thời gian tùy chỉnh</Radio>
  <Radio value="schedule">Lịch trình cố định</Radio>
</Radio.Group>
```

### **2. Xóa preset options Select:**

**Trước:**
```javascript
{autoUpdateSettings.timeType === 'preset' && (
  <Select
    value={autoUpdateSettings.interval}
    onChange={(value) => setAutoUpdateSettings(prev => ({ ...prev, interval: value }))}
    style={{ width: '100%' }}
    options={[
      { value: 5, label: '5 phút' },
      { value: 10, label: '10 phút' },
      { value: 15, label: '15 phút' },
      { value: 30, label: '30 phút' },
      { value: 60, label: '1 giờ' },
      { value: 120, label: '2 giờ' },
      { value: 240, label: '4 giờ' },
      { value: 480, label: '8 giờ' },
      { value: 720, label: '12 giờ' },
      { value: 1440, label: '24 giờ' }
    ]}
  />
)}
```

**Sau:**
```javascript
// Đã xóa hoàn toàn
```

### **3. Cập nhật logic mặc định trong `handleOpenAutoUpdateModal`:**

**Trước:**
```javascript
// Xác định loại thời gian (preset, custom, hoặc schedule)
const presetOptions = [5, 10, 15, 30, 60, 120, 240, 480, 720, 1440];
const isPreset = presetOptions.includes(currentInterval);

// Xác định timeType: ưu tiên interval trước (để tránh bị stuck ở schedule)
let timeType = 'preset'; // default
if (isPreset) {
  timeType = 'preset';
} else if (hasScheduleType) {
  timeType = 'schedule';
} else {
  timeType = 'custom';
}
```

**Sau:**
```javascript
// Xác định loại thời gian (custom hoặc schedule)
// Kiểm tra xem có phải schedule không (dựa vào scheduleType)
const hasScheduleType = service.autoUpdate?.scheduleType;

// Xác định timeType: ưu tiên schedule trước, mặc định là custom
let timeType = 'custom'; // default
if (hasScheduleType) {
  timeType = 'schedule';
} else {
  timeType = 'custom';
}
```

### **4. Cập nhật logic trong `handleSaveAutoUpdateSettings`:**

**Trước:**
```javascript
} else {
  // Xử lý interval (preset hoặc custom)
  let finalInterval = autoUpdateSettings.interval;
  
  if (autoUpdateSettings.timeType === 'custom') {
    const { customValue, customUnit } = autoUpdateSettings;
    if (customUnit === 'days') {
      finalInterval = customValue * 1440; // 1 ngày = 1440 phút
    } else if (customUnit === 'hours') {
      finalInterval = customValue * 60; // 1 giờ = 60 phút
    } else {
      finalInterval = customValue; // phút
    }
  }
  
  requestData.interval = finalInterval;
```

**Sau:**
```javascript
} else {
  // Xử lý interval (chỉ custom)
  const { customValue, customUnit } = autoUpdateSettings;
  let finalInterval;
  
  if (customUnit === 'days') {
    finalInterval = customValue * 1440; // 1 ngày = 1440 phút
  } else if (customUnit === 'hours') {
    finalInterval = customValue * 60; // 1 giờ = 60 phút
  } else {
    finalInterval = customValue; // phút
  }
  
  requestData.interval = finalInterval;
```

### **5. Cập nhật logic hiển thị "Thông tin hiện tại":**

**Trước:**
```javascript
Khoảng thời gian: {formatIntervalDisplay(
  autoUpdateSettings.timeType === 'custom' 
    ? (autoUpdateSettings.customUnit === 'days' 
        ? autoUpdateSettings.customValue * 1440
        : autoUpdateSettings.customUnit === 'hours'
        ? autoUpdateSettings.customValue * 60
        : autoUpdateSettings.customValue)
    : autoUpdateSettings.interval,
  null,
  null
)}
```

**Sau:**
```javascript
Khoảng thời gian: {formatIntervalDisplay(
  autoUpdateSettings.customUnit === 'days' 
    ? autoUpdateSettings.customValue * 1440
    : autoUpdateSettings.customUnit === 'hours'
    ? autoUpdateSettings.customValue * 60
    : autoUpdateSettings.customValue,
  null,
  null
)}
```

### **6. Cập nhật mô tả trong modal:**

**Trước:**
```javascript
<p>• <strong>Thời gian có sẵn:</strong> Chọn từ các khoảng thời gian cố định</p>
<p>• <strong>Thời gian tùy chỉnh:</strong> Nhập số + chọn đơn vị (phút/giờ/ngày)</p>
<p>• <strong>Lịch trình cố định:</strong> Cập nhật vào thời gian cụ thể mỗi ngày/tuần/tháng</p>
```

**Sau:**
```javascript
<p>• <strong>Thời gian tùy chỉnh:</strong> Nhập số + chọn đơn vị (phút/giờ/ngày)</p>
<p>• <strong>Lịch trình cố định:</strong> Cập nhật vào thời gian cụ thể mỗi ngày/tuần/tháng</p>
```

### **7. Cập nhật logic xóa dữ liệu cũ:**

**Trước:**
```javascript
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
}
```

**Sau:**
```javascript
} else if (newTimeType === 'custom') {
  // Chuyển sang interval -> xóa schedule data
  setAutoUpdateSettings(prev => ({
    ...prev,
    timeType: newTimeType,
    scheduleType: null,
    scheduleTime: null,
    scheduleDate: null,
    scheduleDays: []
  }));
}
```

## 🎯 Kết quả

### **Giao diện mới:**
```
Chọn khoảng thời gian cập nhật
○ Thời gian tùy chỉnh
○ Lịch trình cố định

[Khi chọn "Thời gian tùy chỉnh"]
[InputNumber] [Select: phút/giờ/ngày]

[Khi chọn "Lịch trình cố định"]
[Select: Hàng ngày/Hàng tuần/Hàng tháng/Một lần duy nhất]
[TimePicker: HH:mm]
[DatePicker: nếu chọn "Một lần duy nhất"]
[Select multiple: nếu chọn "Hàng tuần"]
```

### **Logic mới:**
- **Mặc định:** `timeType = 'custom'`
- **Chỉ có 2 tùy chọn:** `custom` và `schedule`
- **Không còn preset options:** User phải nhập thời gian tùy chỉnh
- **Đơn giản hóa:** Ít tùy chọn hơn, dễ sử dụng hơn

## ✅ Lợi ích

- ✅ **Đơn giản hóa giao diện:** Chỉ 2 tùy chọn thay vì 3
- ✅ **Linh hoạt hơn:** User có thể nhập bất kỳ thời gian nào
- ✅ **Dễ hiểu hơn:** Không còn bối rối giữa "có sẵn" và "tùy chỉnh"
- ✅ **Code sạch hơn:** Bớt logic xử lý preset
- ✅ **UX tốt hơn:** Ít tùy chọn, tập trung vào 2 loại chính

Bây giờ modal chỉ có 2 tùy chọn: "Thời gian tùy chỉnh" và "Lịch trình cố định"! 🎯✨
