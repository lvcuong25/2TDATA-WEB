# 🐛 Debug Instructions - Frontend Issue

## ✅ Phần Backend đã hoạt động tốt
- API endpoints hoạt động chính xác
- Authentication đã được thiết lập
- Record creation API đã test thành công

## 🔍 Vấn đề nằm ở Frontend

### Bước 1: Kiểm tra Browser Console
1. Mở trang TableDetail trong browser
2. Bấm F12 để mở Developer Tools
3. Vào tab Console
4. Ấn nút "Add Row"
5. Xem có error gì hiện ra

### Bước 2: Kiểm tra Network Tab
1. Vào tab Network trong Developer Tools
2. Ấn nút "Add Row" 
3. Xem có request nào được gửi không
4. Nếu có request, xem status code và response

### Bước 3: Kiểm tra Authentication
1. Vào tab Application -> Cookies
2. Xem có cookie "accessToken" không
3. Nếu không có, cần đăng nhập lại

## 📝 Debug Code đã thêm vào TableDetail.jsx

File đã được update với debug logging chi tiết:

```javascript
const handleAddRow = () => {
  console.log("=== DEBUG: Add Row Function Called ===");
  console.log("🔍 Current state:", {
    columns: columns,
    tableId: tableId,
    databaseId: databaseId,
    columnsLength: columns?.length,
    mutationState: {
      isPending: addRecordMutation.isPending,
      isError: addRecordMutation.isError,
      error: addRecordMutation.error
    }
  });

  // Check authentication
  const cookies = document.cookie;
  console.log("🔐 Auth check:", {
    hasCookies: !!cookies,
    hasAccessToken: cookies.includes("accessToken"),
    cookieString: cookies
  });

  // ... rest of function
};
```

## 🚀 Các bước để fix

### Nếu không có columns:
- Kiểm tra API call lấy table structure
- Xem tableId và databaseId có đúng không

### Nếu không có authentication:
- Đăng nhập lại bằng: superadmin@2tdata.com / admin123
- Kiểm tra cookie được set chưa

### Nếu mutation không chạy:
- Kiểm tra React Query setup
- Xem có lỗi trong console không

## 📊 Test Data đã tạo
- Database ID: 68a80a9fc4e5218ab1e615c9
- Table ID: 68a81819fc77d9db7dcc0b2b  
- Column: Name (text)

Có thể truy cập URL: `/database/68a80a9fc4e5218ab1e615c9/tables/68a81819fc77d9db7dcc0b2b`
