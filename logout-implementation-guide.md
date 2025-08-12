# Hướng dẫn Logout Implementation

## Tổng quan

Logout trong dự án 2TDATA-WEB-dev đã được cập nhật để xử lý cả client-side và server-side cleanup một cách toàn diện.

## Các thay đổi đã thực hiện

### 1. Backend Changes

#### A. Export logout function trong router
```javascript
// BE/src/router/routerAuth.js
import { 
    signUp, 
    signIn, 
    getMe, 
    resetPassword, 
    changePassword,
    logout, // Thêm logout
} from "../controllers/auth.js";

// Thêm route
routerAuth.post("/logout", logout);
```

#### B. Logout controller (BE/src/controllers/auth.js)
```javascript
export const logout = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            await UserSession.invalidateSession(userId, token);
        }

        // Clear the access token cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            path: '/',
            domain: isProduction ? undefined : undefined
        });
        
        return res.status(200).json({
            message: "Đăng xuất thành công"
        });
    } catch (error) {
        next(error);
    }
}
```

### 2. Frontend Changes

#### A. Updated Logout Component (FE/src/components/logout.jsx)
```javascript
const handleLogout = async () => {
    try {
        // Call backend logout API to clear cookie
        try {
            await instance.post('/auth/logout');
            console.log('Backend logout successful');
        } catch (apiError) {
            console.warn('Backend logout failed, continuing with client-side cleanup:', apiError);
            // Continue with client-side cleanup even if API fails
        }

        // Clear all authentication data from client
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        
        // Clear any other auth-related data
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Clear any cached user data
        if (window.userData) {
            delete window.userData;
        }
        
        // Clear React Query cache if available
        if (window.queryClient) {
            window.queryClient.clear();
        }
        
        // Clear any other potential auth data
        Object.keys(localStorage).forEach(key => {
            if (key.includes('auth') || key.includes('token') || key.includes('user')) {
                localStorage.removeItem(key);
            }
        });
        
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes('auth') || key.includes('token') || key.includes('user')) {
                sessionStorage.removeItem(key);
            }
        });
        
        // Show success message
        toast.success('Đăng xuất thành công!');

        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Có lỗi xảy ra khi đăng xuất!');
        
        // Force redirect even if there's an error
        window.location.href = '/';
    }
};
```

## Lợi ích của implementation mới

### 1. Server-side Cleanup
- **Invalidate session**: Xóa session trong database
- **Clear HTTP-only cookie**: Xóa access token cookie an toàn
- **Proper response**: Trả về message thành công

### 2. Client-side Cleanup
- **Multiple storage cleanup**: Xóa từ localStorage, sessionStorage
- **Pattern-based cleanup**: Xóa tất cả data có chứa 'auth', 'token', 'user'
- **Cache cleanup**: Xóa React Query cache nếu có
- **Window data cleanup**: Xóa cached user data

### 3. Error Handling
- **Graceful degradation**: Tiếp tục cleanup ngay cả khi API fails
- **User feedback**: Hiển thị message thành công/lỗi
- **Force redirect**: Đảm bảo user được redirect về home

### 4. Security
- **Cookie clearing**: Xóa HTTP-only cookie an toàn
- **Session invalidation**: Xóa session trong database
- **Complete cleanup**: Xóa tất cả auth-related data

## Testing

### 1. Test Logout Flow
```javascript
// 1. Login thành công
// 2. Click logout button
// 3. Kiểm tra:
//    - API call thành công
//    - Cookie được clear
//    - localStorage/sessionStorage được clear
//    - Redirect về home page
```

### 2. Test Error Handling
```javascript
// 1. Disconnect network
// 2. Click logout button
// 3. Kiểm tra:
//    - Client-side cleanup vẫn hoạt động
//    - User được redirect về home
//    - Error message được hiển thị
```

### 3. Test Data Cleanup
```javascript
// Trước logout:
localStorage.getItem('accessToken') // Có data

// Sau logout:
localStorage.getItem('accessToken') // null
sessionStorage.getItem('user') // null
```

## Integration với các component khác

### 1. AuthContext
```javascript
// FE/src/components/core/Auth.jsx
const removeCurrentUser = () => {
    removeAuth();
    setCurrentUser(null);
};
```

### 2. Axios Interceptors
```javascript
// FE/src/utils/axiosInstance.jsx
if (error.response?.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    // Redirect to login
}
```

### 3. UserDropdown
```javascript
// FE/src/components/UserProfile/UserDropdown.jsx
const handleLogout = () => {
    removeCurrentUser();
    toast.success('Đăng xuất thành công!');
    window.location.href = '/';
};
```

## Best Practices

### 1. Always call backend first
- Đảm bảo session được invalidate
- Clear HTTP-only cookies
- Proper cleanup ở server

### 2. Comprehensive client cleanup
- Xóa tất cả auth-related data
- Clear caches
- Remove window data

### 3. Graceful error handling
- Continue cleanup ngay cả khi API fails
- Provide user feedback
- Ensure redirect happens

### 4. Security considerations
- Clear HTTP-only cookies
- Invalidate sessions
- Remove all tokens

## Troubleshooting

### Issue: Cookie not cleared
**Solution**: Check cookie options (domain, path, secure)

### Issue: Session not invalidated
**Solution**: Verify logout API call succeeds

### Issue: Client data not cleared
**Solution**: Check localStorage/sessionStorage cleanup

### Issue: Redirect not working
**Solution**: Use window.location.href instead of navigate()

## Future Improvements

1. **Refresh token handling**: Implement refresh token cleanup
2. **Multi-tab sync**: Sync logout across browser tabs
3. **Analytics**: Track logout events
4. **Session timeout**: Automatic logout on inactivity
5. **Remember me**: Handle "remember me" functionality
