# Trạng thái nút "Cập nhật" khi Auto Update

## 🎯 Câu hỏi

**"Thế đến h đó nút cập nhật có chuyển sang đang cập nhật k?"**

## ✅ Trả lời: CÓ!

Khi đến thời gian cập nhật tự động, nút "Cập nhật" sẽ chuyển sang trạng thái "Đang cập nhật..." với loading spinner.

## 🔄 Luồng hoạt động

### **1. Trước khi Auto Update:**
```
┌─────────────────────────────────┐
│ [Cập nhật]                     │ ← Nút bình thường
└─────────────────────────────────┘
```

### **2. Khi Auto Update đang chạy:**
```
┌─────────────────────────────────┐
│ [🔄 Đang cập nhật...]          │ ← Nút loading
└─────────────────────────────────┘
```

### **3. Sau khi Auto Update hoàn thành:**
```
┌─────────────────────────────────┐
│ [Cập nhật]                     │ ← Nút trở lại bình thường
└─────────────────────────────────┘
```

## 🔧 Cách hoạt động

### **Frontend Logic:**
```javascript
// Trong MyService.jsx
<Button
  loading={updatingServiceId === record._id || record.autoUpdate?.isUpdating}
  icon={updatingServiceId === record._id || record.autoUpdate?.isUpdating ? <LoadingOutlined /> : null}
>
  {updatingServiceId === record._id || record.autoUpdate?.isUpdating ? "Đang cập nhật..." : "Cập nhật"}
</Button>
```

**Điều kiện hiển thị "Đang cập nhật...":**
- `updatingServiceId === record._id` (khi user click nút thủ công)
- `record.autoUpdate?.isUpdating` (khi auto update đang chạy)

### **Backend Logic:**
```javascript
// Trong autoUpdateService.js
// 1. Bắt đầu auto update
service.autoUpdate.isUpdating = true;
await service.save();

// 2. Thực hiện cập nhật
await Promise.all(service.link_update.map(link => fetch(link.url)));

// 3. Kết thúc auto update
service.autoUpdate.isUpdating = false;
await service.save();
```

## 📊 Database Schema

### **UserService Model:**
```javascript
autoUpdate: {
  enabled: Boolean,
  interval: Number,
  scheduleType: String,
  scheduleTime: String,
  scheduleDate: Date,
  scheduleDays: [Number],
  lastUpdateAt: Date,
  nextUpdateAt: Date,
  isUpdating: Boolean  // ← Trường này điều khiển trạng thái nút
}
```

## 🎬 Demo Timeline

### **Timeline Auto Update:**

```
00:00 - Nút hiển thị: [Cập nhật]
00:01 - Auto update bắt đầu
       - Backend: isUpdating = true
       - Frontend: Nút hiển thị [🔄 Đang cập nhật...]
00:02 - Auto update đang chạy
       - Gọi các link_update
       - Nút vẫn hiển thị [🔄 Đang cập nhật...]
00:03 - Auto update hoàn thành
       - Backend: isUpdating = false
       - Frontend: Nút hiển thị [Cập nhật]
```

## 🧪 Test Cases

### **Test 1: Auto Update với Interval**
```
Setup: interval = 1 phút, enabled = true
Expected:
- 00:00: Nút [Cập nhật]
- 00:01: Nút [🔄 Đang cập nhật...]
- 00:02: Nút [Cập nhật]
```

### **Test 2: Auto Update với Schedule**
```
Setup: scheduleType = 'daily', scheduleTime = '08:00'
Expected:
- 07:59: Nút [Cập nhật]
- 08:00: Nút [🔄 Đang cập nhật...]
- 08:01: Nút [Cập nhật]
```

### **Test 3: Manual Update**
```
Action: User click nút [Cập nhật]
Expected:
- Click: Nút [🔄 Đang cập nhật...]
- Complete: Nút [Cập nhật]
```

## 🔍 Cách kiểm tra

### **1. Kiểm tra trong Database:**
```javascript
// Tìm service có isUpdating = true
db.userservices.find({"autoUpdate.isUpdating": true})
```

### **2. Kiểm tra trong Frontend:**
```javascript
// Console log để xem trạng thái
console.log(record.autoUpdate?.isUpdating)
```

### **3. Kiểm tra trong Backend:**
```bash
# Chạy script auto update
cd BE
npm run auto-update
```

## ⚠️ Lưu ý quan trọng

### **1. Script Auto Update cần chạy:**
- Script `autoUpdateService.js` phải được chạy định kỳ (cron job)
- Nếu không chạy, auto update sẽ không hoạt động

### **2. Trạng thái isUpdating:**
- `true`: Nút hiển thị "Đang cập nhật..."
- `false`: Nút hiển thị "Cập nhật"
- Nếu script bị crash, `isUpdating` có thể bị stuck ở `true`

### **3. Error Handling:**
```javascript
// Script có xử lý lỗi
try {
  service.autoUpdate.isUpdating = true;
  await service.save();
  
  // Thực hiện cập nhật
  await performUpdate();
  
  service.autoUpdate.isUpdating = false;
  await service.save();
} catch (error) {
  // Đảm bảo reset trạng thái khi có lỗi
  service.autoUpdate.isUpdating = false;
  await service.save();
}
```

## 🎯 Kết luận

**CÓ!** Khi đến thời gian cập nhật tự động:

1. ✅ **Nút chuyển sang "Đang cập nhật..."**
2. ✅ **Hiển thị loading spinner**
3. ✅ **Tự động gọi các link_update**
4. ✅ **Cập nhật thời gian tiếp theo**
5. ✅ **Nút trở lại "Cập nhật"**

Người dùng sẽ thấy rõ ràng khi nào hệ thống đang thực hiện auto update! 🎉
