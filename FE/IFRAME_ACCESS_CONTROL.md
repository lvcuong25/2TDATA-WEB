# 🔒 Iframe Access Control - Quản lý quyền truy cập iframe

## 📋 Tóm tắt thay đổi

### ❌ Trước đây:
- Tất cả admin (admin, site_admin, super_admin) đều có thể truy cập quản lý iframe
- Không có phân quyền rõ ràng giữa các role

### ✅ Sau khi thay đổi:
- **Chỉ site_admin và super_admin** mới có thể truy cập quản lý iframe
- **Admin thường** (role: admin) không còn quyền truy cập
- **User thường** vẫn có thể xem iframe nếu được thêm vào danh sách viewers

## 🔧 Các thay đổi chi tiết

### 1. **Frontend - Menu Admin (`FE/src/components/admin/DashBoard.jsx`)**

#### Thay đổi:
```javascript
// Trước đây: Hiển thị cho tất cả admin
{
  key: '/admin/iframe',
  icon: <LinkOutlined />,
  label: <Link to="/admin/iframe">Quản lý iframe</Link>,
  onClick: () => handleLinkClick('/admin/iframe')
}

// Sau khi thay đổi: Chỉ hiển thị cho site_admin và super_admin
if (authContext?.isSuperAdmin || currentUser?.role === 'site_admin') {
  baseItems.push({
    key: '/admin/iframe',
    icon: <LinkOutlined />,
    label: <Link to="/admin/iframe">Quản lý iframe</Link>,
    onClick: () => handleLinkClick('/admin/iframe')
  });
}
```

### 2. **Frontend - Route Protection (`FE/src/router/PrivateRoute.jsx`)**

#### Tạo route component mới:
```javascript
const IframeAdminRoute = ({ children }) => {
  // Chỉ cho phép site_admin và super_admin truy cập
  const allowedRoles = ["site_admin", "super_admin"];
  const hasValidRole = currentUser.role && allowedRoles.includes(currentUser.role);
  
  return (
    <ConditionalRoute
      condition={!!(currentUser && currentUser._id && hasValidRole)}
      redirectTo={`/signin?redirect=${encodeURIComponent(location.pathname)}`}
      children={children}
    />
  );
};
```

### 3. **Frontend - Router (`FE/src/router/index.jsx`)**

#### Thay đổi route:
```javascript
// Trước đây
<Route path="iframe">
  <Route index element={
    <SuperAdminRoute>
      <IframeList />
    </SuperAdminRoute>
  } />
</Route>

// Sau khi thay đổi
<Route path="iframe">
  <Route index element={
    <IframeAdminRoute>
      <IframeList />
    </IframeAdminRoute>
  } />
</Route>
```

### 4. **Backend - Controller (`BE/src/controllers/iframe.js`)**

#### Thêm kiểm tra quyền truy cập:
```javascript
// Chỉ cho phép site_admin và super_admin truy cập
if (req.user.role !== 'site_admin' && req.user.role !== 'super_admin') {
  console.log('[IFRAME] Access denied for role:', req.user.role);
  return res.status(403).json({ 
    message: "Chỉ site admin và super admin mới có quyền truy cập quản lý iframe",
    error: "ACCESS_DENIED"
  });
}
```

#### Áp dụng cho tất cả API:
- `getAllIframes` - Lấy danh sách iframe
- `getIframeById` - Lấy iframe theo ID
- `createIframe` - Tạo iframe mới
- `updateIframe` - Cập nhật iframe
- `deleteIframe` - Xóa iframe

### 5. **Frontend - Component (`FE/src/components/admin/Iframe/IframeList.jsx`)**

#### Thêm kiểm tra quyền truy cập:
```javascript
// Kiểm tra quyền truy cập
const hasAccess = isSuperAdmin || isSiteAdmin;

// Hiển thị thông báo không có quyền truy cập
if (!hasAccess) {
  return (
    <div style={{ padding: '24px' }}>
      <Alert
        message="Không có quyền truy cập"
        description="Chỉ site admin và super admin mới có quyền truy cập quản lý iframe."
        type="warning"
        showIcon
        icon={<LockOutlined />}
      />
      {/* ... */}
    </div>
  );
}
```

#### Xử lý lỗi access denied:
```javascript
// Kiểm tra lỗi access denied
if (error?.response?.status === 403) {
  toast.error('Bạn không có quyền tạo iframe. Chỉ site admin và super admin mới có quyền này.');
}
```

## 🎯 Phân quyền chi tiết

### 👑 **Super Admin (super_admin)**
- ✅ Truy cập quản lý iframe
- ✅ Xem tất cả iframe của tất cả sites
- ✅ Tạo, sửa, xóa iframe cho bất kỳ site nào
- ✅ Chọn site khi tạo iframe

### 🏢 **Site Admin (site_admin)**
- ✅ Truy cập quản lý iframe
- ✅ Xem iframe của site mình
- ✅ Tạo, sửa, xóa iframe cho site mình
- ❌ Không thể tạo iframe cho site khác

### 👤 **Admin thường (admin)**
- ❌ Không thể truy cập quản lý iframe
- ❌ Không thể tạo, sửa, xóa iframe
- ✅ Vẫn có thể xem iframe nếu được thêm vào danh sách viewers

### 👥 **User thường (user)**
- ❌ Không thể truy cập quản lý iframe
- ❌ Không thể tạo, sửa, xóa iframe
- ✅ Chỉ xem iframe nếu được thêm vào danh sách viewers

## 🔍 Test Cases

### ✅ **Test cases đã được xử lý:**

1. **Super Admin Access:**
   - ✅ Có thể truy cập `/admin/iframe`
   - ✅ Có thể tạo, sửa, xóa iframe
   - ✅ Có thể chọn site khi tạo iframe

2. **Site Admin Access:**
   - ✅ Có thể truy cập `/admin/iframe`
   - ✅ Chỉ thấy iframe của site mình
   - ✅ Có thể tạo, sửa, xóa iframe cho site mình
   - ❌ Không thể tạo iframe cho site khác

3. **Admin thường Access:**
   - ❌ Không thể truy cập `/admin/iframe`
   - ❌ Hiển thị thông báo "Không có quyền truy cập"
   - ❌ Không thể tạo, sửa, xóa iframe

4. **User thường Access:**
   - ❌ Không thể truy cập `/admin/iframe`
   - ❌ Hiển thị thông báo "Không có quyền truy cập"
   - ✅ Vẫn có thể xem iframe nếu là viewer

5. **API Protection:**
   - ✅ Tất cả API iframe đều được bảo vệ
   - ✅ Trả về lỗi 403 cho role không có quyền
   - ✅ Thông báo lỗi rõ ràng

## 🛡️ Security Improvements

### 🔒 **Bảo mật:**
- **Role-based access control**: Kiểm tra role trước khi cho phép truy cập
- **API protection**: Backend cũng kiểm tra quyền truy cập
- **UI feedback**: Hiển thị thông báo rõ ràng khi không có quyền
- **Graceful degradation**: Xử lý lỗi một cách thân thiện với user

### 📊 **Audit trail:**
- Log tất cả các truy cập bị từ chối
- Ghi lại role và user ID khi có lỗi access denied
- Console logs để debug

## 🚀 Deployment Notes

### ⚠️ **Lưu ý khi triển khai:**
1. **Database**: Không cần thay đổi database
2. **Migration**: Không cần migration
3. **Backward compatibility**: Các iframe hiện tại vẫn hoạt động bình thường
4. **User experience**: Admin thường sẽ thấy thông báo "Không có quyền truy cập"

### 🔄 **Rollback plan:**
Nếu cần rollback, chỉ cần:
1. Revert thay đổi trong `DashBoard.jsx`
2. Revert thay đổi trong `PrivateRoute.jsx`
3. Revert thay đổi trong `iframe.js` controller

## 📝 Future Improvements

### 🔮 **Có thể cải thiện thêm:**
1. **Granular permissions**: Cho phép cấu hình quyền chi tiết hơn
2. **Audit log**: Ghi lại tất cả thao tác với iframe
3. **Bulk operations**: Cho phép thao tác hàng loạt
4. **Advanced filtering**: Lọc iframe theo nhiều tiêu chí

---

**Tác giả**: AI Assistant  
**Ngày**: $(date)  
**Version**: 1.0.0
