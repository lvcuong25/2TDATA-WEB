# Debug lỗi table hiển thị sai khi chọn "Thời gian tùy chỉnh"

## 🐛 Vấn đề

**"Khi tôi chọn thời gian tùy chỉnh thì nó hiện lên table chứ tại sao lại hiện của lịch trình cố định kiểm tra fe và be"**

User chọn "Thời gian tùy chỉnh" → "1 phút" nhưng table vẫn hiển thị "Hàng ngày lúc 01:00" thay vì "1 phút".

## 🔍 Debug đã thêm

### **1. Frontend Debug Logs:**

#### **A. formatIntervalDisplay function:**
```javascript
const formatIntervalDisplay = (interval, scheduleType, scheduleTime) => {
  console.log('formatIntervalDisplay called with:', { 
    interval, 
    scheduleType, 
    scheduleTime,
    intervalType: typeof interval,
    scheduleTypeType: typeof scheduleType,
    scheduleTimeType: typeof scheduleTime
  });
  
  // Kiểm tra scheduleType có hợp lệ không
  const hasValidSchedule = scheduleType && 
    scheduleType !== null && 
    scheduleType !== undefined && 
    scheduleType !== 'null' &&
    scheduleType.trim() !== '';
  
  console.log('hasValidSchedule:', hasValidSchedule);
  
  if (hasValidSchedule) {
    console.log('Using scheduleType logic:', scheduleType);
    // ... schedule logic
  } else {
    console.log('Using interval logic:', interval);
    // ... interval logic
  }
};
```

#### **B. Table render function:**
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

### **2. Backend Debug Logs:**

#### **A. Request body logging:**
```javascript
console.log('Auto update request body:', req.body);
console.log('Request details:', {
    enabled,
    interval,
    scheduleType,
    scheduleTime,
    scheduleDate,
    scheduleDays,
    nextUpdateAt,
    clearInterval,
    clearSchedule
});
```

#### **B. Before/After save logging:**
```javascript
console.log('Before save - autoUpdate:', JSON.stringify(userService.autoUpdate, null, 2));
console.log('Before save - autoUpdate details:', {
    enabled: userService.autoUpdate.enabled,
    interval: userService.autoUpdate.interval,
    scheduleType: userService.autoUpdate.scheduleType,
    scheduleTime: userService.autoUpdate.scheduleTime,
    scheduleDate: userService.autoUpdate.scheduleDate,
    scheduleDays: userService.autoUpdate.scheduleDays,
    nextUpdateAt: userService.autoUpdate.nextUpdateAt
});
await userService.save();
console.log('After save - autoUpdate:', JSON.stringify(userService.autoUpdate, null, 2));
console.log('After save - autoUpdate details:', {
    enabled: userService.autoUpdate.enabled,
    interval: userService.autoUpdate.interval,
    scheduleType: userService.autoUpdate.scheduleType,
    scheduleTime: userService.autoUpdate.scheduleTime,
    scheduleDate: userService.autoUpdate.scheduleDate,
    scheduleDays: userService.autoUpdate.scheduleDays,
    nextUpdateAt: userService.autoUpdate.nextUpdateAt
});
```

## 🧪 Test Cases

### **Test 1: Chọn "Thời gian tùy chỉnh" → "1 phút"**

**Expected Frontend Console:**
```
Current info display - autoUpdateSettings: { 
  timeType: 'custom', 
  interval: 30, 
  scheduleType: null, 
  scheduleTime: null, 
  customValue: 1, 
  customUnit: 'minutes' 
}

Table display data for service: [Service Name] {
  interval: 1,
  scheduleType: null,
  scheduleTime: null,
  enabled: true
}

formatIntervalDisplay called with: { 
  interval: 1, 
  scheduleType: null, 
  scheduleTime: null,
  intervalType: 'number',
  scheduleTypeType: 'object',
  scheduleTimeType: 'object'
}

hasValidSchedule: false
Using interval logic: 1
Returning minutes: 1
Formatted display text: 1 phút
```

**Expected Backend Console:**
```
Auto update request body: {
  enabled: true,
  interval: 1,
  scheduleType: null,
  scheduleTime: null,
  scheduleDate: null,
  scheduleDays: null,
  clearSchedule: true
}

Before save - autoUpdate details: {
  enabled: true,
  interval: 1,
  scheduleType: undefined,
  scheduleTime: undefined,
  scheduleDate: undefined,
  scheduleDays: undefined,
  nextUpdateAt: [future timestamp]
}

After save - autoUpdate details: {
  enabled: true,
  interval: 1,
  scheduleType: undefined,
  scheduleTime: undefined,
  scheduleDate: undefined,
  scheduleDays: undefined,
  nextUpdateAt: [future timestamp]
}
```

**Expected Table Display:** `1 phút` ✅

### **Test 2: Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00"**

**Expected Frontend Console:**
```
Current info display - autoUpdateSettings: { 
  timeType: 'schedule', 
  interval: null, 
  scheduleType: 'daily', 
  scheduleTime: [dayjs object], 
  customValue: 1, 
  customUnit: 'minutes' 
}

Table display data for service: [Service Name] {
  interval: null,
  scheduleType: 'daily',
  scheduleTime: '08:00',
  enabled: true
}

formatIntervalDisplay called with: { 
  interval: null, 
  scheduleType: 'daily', 
  scheduleTime: '08:00',
  intervalType: 'object',
  scheduleTypeType: 'string',
  scheduleTimeType: 'string'
}

hasValidSchedule: true
Using scheduleType logic: daily
Formatted display text: Hàng ngày lúc 08:00
```

**Expected Backend Console:**
```
Auto update request body: {
  enabled: true,
  interval: null,
  scheduleType: 'daily',
  scheduleTime: '08:00',
  scheduleDate: null,
  scheduleDays: null,
  clearInterval: true
}

Before save - autoUpdate details: {
  enabled: true,
  interval: undefined,
  scheduleType: 'daily',
  scheduleTime: '08:00',
  scheduleDate: undefined,
  scheduleDays: undefined,
  nextUpdateAt: [future timestamp]
}

After save - autoUpdate details: {
  enabled: true,
  interval: undefined,
  scheduleType: 'daily',
  scheduleTime: '08:00',
  scheduleDate: undefined,
  scheduleDays: undefined,
  nextUpdateAt: [future timestamp]
}
```

**Expected Table Display:** `Hàng ngày lúc 08:00` ✅

## 🔍 Các vấn đề có thể xảy ra

### **1. Frontend Issues:**
- ❌ `scheduleType` không được set thành `null` khi chọn custom
- ❌ `interval` không được set đúng giá trị
- ❌ Logic `formatIntervalDisplay` không hoạt động đúng
- ❌ Data refresh không hoạt động sau khi save

### **2. Backend Issues:**
- ❌ `clearSchedule` không được xử lý đúng
- ❌ `scheduleType` không được set thành `undefined`
- ❌ `interval` không được save đúng
- ❌ Database không được update

### **3. Data Flow Issues:**
- ❌ Frontend gửi sai data
- ❌ Backend xử lý sai data
- ❌ Database lưu sai data
- ❌ Frontend nhận sai data từ API

## 🎯 Cách kiểm tra

### **1. Mở Developer Tools (F12 → Console)**

### **2. Thực hiện test:**
1. **Mở cài đặt auto update** cho một dịch vụ
2. **Chọn "Thời gian tùy chỉnh"** → "1 phút"
3. **Lưu cài đặt**
4. **Kiểm tra console logs** để xem:
   - Frontend gửi data gì?
   - Backend nhận data gì?
   - Backend save data gì?
   - Table hiển thị data gì?

### **3. So sánh với Expected Results:**
- Nếu khác → Xác định vấn đề ở đâu
- Nếu giống → Vấn đề ở logic khác

## ✅ Kết quả mong đợi

Sau khi debug, chúng ta sẽ biết chính xác:
- ✅ **Frontend gửi data gì** khi chọn "Thời gian tùy chỉnh"
- ✅ **Backend nhận và xử lý data như thế nào**
- ✅ **Database lưu data gì**
- ✅ **Table hiển thị data gì và tại sao**

Debug logs sẽ giúp xác định chính xác vấn đề ở đâu trong flow! 🔍
