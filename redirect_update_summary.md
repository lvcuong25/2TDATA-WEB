# Cập nhật Logic Redirect Sau Login

## Thay đổi đã thực hiện:

### File: `BE/src/controllers/auth.js`

**Trước:**
```javascript
// User thường - redirect về homepage của site họ
else {
    if (!userExist.service || userExist.service.length === 0) {
        redirectPath = '/service/my-service';
    } else {
        redirectPath = '/';
    }
    // ...
}
```

**Sau:**
```javascript
// User thường - redirect về homepage của site họ
else {
    // Tất cả user thường đều redirect về /service/my-service
    redirectPath = '/service/my-service';
    // ...
}
```

## Kết quả:
- ✅ Tất cả user thường (không phải admin) sẽ được redirect về `/service/my-service` sau khi login
- ✅ Không phân biệt user có service hay không có service
- ✅ Logic redirect cho Super Admin và Site Admin không thay đổi

## Lưu ý:
- Cần restart backend service để thay đổi có hiệu lực
- Frontend vẫn giữ nguyên logic ưu tiên URL param redirect cho user thường
