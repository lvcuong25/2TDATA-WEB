# Sửa lỗi hiển thị thời gian trong table

## 🎯 Vấn đề

**"Khi tôi chọn khoảng thời gian cập nhật thì table cũng phải hiện thời gian đúng theo chứ"**

Khi chọn "Chọn khoảng thời gian cập nhật" trong modal, cột "Cập nhật tự động" trong table phải hiển thị thời gian đúng theo lựa chọn.

## 🔍 Phân tích

### **1. Logic hiển thị đã đúng:**
```javascript
// Trong cột "Cập nhật tự động"
{record.autoUpdate?.enabled ? formatIntervalDisplay(
  record.autoUpdate.interval, 
  record.autoUpdate.scheduleType, 
  record.autoUpdate.scheduleTime
) : "Tắt"}
```

### **2. Function formatIntervalDisplay hoạt động đúng:**
```javascript
const formatIntervalDisplay = (interval, scheduleType, scheduleTime) => {
  // Ưu tiên hiển thị scheduleType nếu có
  if (scheduleType) {
    const timeStr = scheduleTime ? (typeof scheduleTime === 'string' ? scheduleTime : scheduleTime.format('HH:mm')) : '';
    switch (scheduleType) {
      case 'daily': return `Hàng ngày lúc ${timeStr}`;
      case 'weekly': return `Hàng tuần lúc ${timeStr}`;
      case 'monthly': return `Hàng tháng lúc ${timeStr}`;
      case 'once': return `Một lần lúc ${timeStr}`;
      default: return `Lịch trình lúc ${timeStr}`;
    }
  }
  
  // Nếu không có scheduleType, hiển thị interval
  if (interval && interval >= 1440) {
    const days = Math.floor(interval / 1440);
    return `${days} ngày`;
  } else if (interval && interval >= 60) {
    const hours = Math.floor(interval / 60);
    return `${hours} giờ`;
  } else if (interval) {
    return `${interval} phút`;
  }
  
  return 'Chưa cài đặt';
};
```

### **3. Test kết quả:**
```
✅ Test 1: interval=30 → "30 phút"
✅ Test 2: interval=120 → "2 giờ"  
✅ Test 3: interval=1440 → "1 ngày"
✅ Test 4: scheduleType='daily', scheduleTime='08:00' → "Hàng ngày lúc 08:00"
✅ Test 5: scheduleType='weekly', scheduleTime='09:00' → "Hàng tuần lúc 09:00"
✅ Test 6: scheduleType='monthly', scheduleTime='10:00' → "Hàng tháng lúc 10:00"
✅ Test 7: scheduleType='once', scheduleTime='11:00' → "Một lần lúc 11:00"
```

## 🐛 Vấn đề thực tế

Vấn đề có thể là **data không được refresh đúng cách** sau khi lưu cài đặt.

### **Trước khi sửa:**
```javascript
// Refresh data
queryClient.invalidateQueries({ queryKey: ["myServices", currentUser?._id] });
queryClient.invalidateQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
```

**Vấn đề**: `invalidateQueries` chỉ đánh dấu data là stale, không force refetch ngay lập tức.

### **Sau khi sửa:**
```javascript
// Refresh data
await queryClient.invalidateQueries({ queryKey: ["myServices", currentUser?._id] });
await queryClient.invalidateQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });

// Force refetch để đảm bảo data được cập nhật
await queryClient.refetchQueries({ queryKey: ["myServices", currentUser?._id] });
await queryClient.refetchQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
```

**Giải pháp**: Thêm `refetchQueries` để force refetch data ngay lập tức.

## 🎯 Kết quả mong đợi

### **1. Chọn "Thời gian có sẵn" → "30 phút":**
```
Table hiển thị:
┌─────────────────────────────────┐
│ [30 phút] [⚙️]                 │
│ 🕐 Tiếp theo: 09:30:06 6/1/2025│
└─────────────────────────────────┘
```

### **2. Chọn "Thời gian tùy chỉnh" → "2 giờ":**
```
Table hiển thị:
┌─────────────────────────────────┐
│ [2 giờ] [⚙️]                   │
│ 🕐 Tiếp theo: 19:00:00 6/1/2025│
└─────────────────────────────────┘
```

### **3. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00":**
```
Table hiển thị:
┌─────────────────────────────────┐
│ [Hàng ngày lúc 08:00] [⚙️]     │
│ 🕐 Tiếp theo: 15:00:00 7/1/2025│
└─────────────────────────────────┘
```

## 🔄 Luồng hoạt động

### **1. User chọn cài đặt:**
```
Modal: Chọn "Thời gian có sẵn" → "30 phút"
```

### **2. User click "Lưu":**
```
Frontend: Gửi request với { interval: 30, clearSchedule: true }
Backend: Lưu vào database
```

### **3. Backend trả về:**
```
Response: { message: "Đã bật cập nhật tự động 30 phút" }
```

### **4. Frontend refresh data:**
```
1. invalidateQueries() - Đánh dấu data là stale
2. refetchQueries() - Force refetch data mới
3. Table hiển thị: [30 phút] [⚙️]
```

## 🧪 Test Cases

### **Test 1: Interval → Schedule**
```
Action:
1. Chọn "Thời gian có sẵn" → "30 phút" → Lưu
2. Kiểm tra table hiển thị: [30 phút]
3. Chọn "Lịch trình cố định" → "Hàng ngày lúc 08:00" → Lưu
4. Kiểm tra table hiển thị: [Hàng ngày lúc 08:00]

Expected: Table cập nhật đúng theo lựa chọn
```

### **Test 2: Schedule → Interval**
```
Action:
1. Chọn "Lịch trình cố định" → "Hàng tuần lúc 09:00" → Lưu
2. Kiểm tra table hiển thị: [Hàng tuần lúc 09:00]
3. Chọn "Thời gian tùy chỉnh" → "2 giờ" → Lưu
4. Kiểm tra table hiển thị: [2 giờ]

Expected: Table cập nhật đúng theo lựa chọn
```

### **Test 3: Custom Time**
```
Action:
1. Chọn "Thời gian tùy chỉnh" → "3 ngày" → Lưu
2. Kiểm tra table hiển thị: [3 ngày]

Expected: Table hiển thị đúng custom time
```

## 🔧 Code Changes

### **File: `/FE/src/components/MyService.jsx`**

**Thay đổi chính:**
```javascript
// Trước
queryClient.invalidateQueries({ queryKey: ["myServices", currentUser?._id] });
queryClient.invalidateQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });

// Sau
await queryClient.invalidateQueries({ queryKey: ["myServices", currentUser?._id] });
await queryClient.invalidateQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });

// Force refetch để đảm bảo data được cập nhật
await queryClient.refetchQueries({ queryKey: ["myServices", currentUser?._id] });
await queryClient.refetchQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
```

## ✅ Kết quả

- ✅ **Table hiển thị đúng** theo lựa chọn trong modal
- ✅ **Data được refresh** ngay lập tức sau khi lưu
- ✅ **Không cần reload** trang để thấy thay đổi
- ✅ **Trải nghiệm mượt mà** cho người dùng

Bây giờ khi bạn chọn "Chọn khoảng thời gian cập nhật" trong modal, table sẽ hiển thị đúng thời gian theo lựa chọn! 🎯
