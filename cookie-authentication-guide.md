# Hướng dẫn sử dụng Cookie cho Authentication

## Tổng quan

Dự án 2TDATA-WEB-dev đã được cập nhật để sử dụng HTTP-only cookies cho việc lưu trữ access token, cung cấp bảo mật tốt hơn so với localStorage.

## Các thay đổi đã thực hiện

### 1. Backend Changes

#### A. Cài đặt cookie-parser
```bash
npm install cookie-parser
```

#### B. Cập nhật app.js
- Import cookie-parser middleware
- Thêm `app.use(cookieParser())` để parse cookies

#### C. Cập nhật auth controller (BE/src/controllers/auth.js)
- **Sign In**: Tự động set HTTP-only cookie khi đăng nhập thành công
- **Logout**: Clear cookie khi đăng xuất

```javascript
// Set secure HTTP-only cookie with access token
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days in milliseconds
    path: '/',
    domain: isProduction ? undefined : undefined
};

res.cookie('accessToken', accessToken, cookieOptions);
```

#### D. Cập nhật middleware (BE/src/middlewares/authAndSiteDetection.js)
- Đọc token từ cả Authorization header và cookie
- Ưu tiên Authorization header trước, sau đó mới đến cookie

```javascript
// Check Authorization header first
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
}

// If no token in header, check cookie
if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
}
```

### 2. Frontend Changes

#### A. Cập nhật axios instance
- Thêm `withCredentials: true` để gửi cookies với requests

#### B. Cập nhật signin component
- Giữ lại localStorage/sessionStorage cho backward compatibility
- Thêm comment giải thích về cookie security

### 3. Nginx Configuration
- Cập nhật CORS headers để hỗ trợ credentials
- Thêm cookie headers cho secure token storage

## Lợi ích của việc sử dụng Cookie

### 1. Bảo mật tốt hơn
- **HttpOnly**: Cookie không thể được truy cập bởi JavaScript, ngăn chặn XSS attacks
- **Secure**: Cookie chỉ được gửi qua HTTPS (trong production)
- **SameSite**: Ngăn chặn CSRF attacks

### 2. Tự động quản lý
- Cookie được tự động gửi với mọi request
- Không cần manually set Authorization header
- Tự động expire theo thời gian đã cấu hình

### 3. Backward Compatibility
- Vẫn hỗ trợ Authorization header
- Vẫn lưu token trong localStorage/sessionStorage
- Không ảnh hưởng đến code hiện tại

## Cấu hình Cookie

### Development Environment
```javascript
{
    httpOnly: true,
    secure: false, // Allow HTTP in development
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
    path: '/'
}
```

### Production Environment
```javascript
{
    httpOnly: true,
    secure: true, // Require HTTPS
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
    path: '/'
}
```

## Testing

### 1. Kiểm tra cookie được set
```javascript
// Trong browser console
document.cookie // Không thấy accessToken (HttpOnly)
```

### 2. Kiểm tra request headers
```javascript
// Trong Network tab
// Cookie header sẽ chứa accessToken
```

### 3. Test authentication flow
1. Đăng nhập thành công
2. Cookie được set tự động
3. Các request tiếp theo sẽ include cookie
4. Đăng xuất sẽ clear cookie

## Troubleshooting

### 1. Cookie không được set
- Kiểm tra CORS configuration
- Đảm bảo `withCredentials: true` trong axios
- Kiểm tra domain và path settings

### 2. Cookie không được gửi
- Kiểm tra `withCredentials: true`
- Đảm bảo domain matching
- Kiểm tra secure flag trong development

### 3. Authentication fails
- Kiểm tra middleware đọc cookie đúng cách
- Verify JWT secret configuration
- Check cookie expiration

## Migration Notes

- Code hiện tại vẫn hoạt động bình thường
- Không cần thay đổi API calls
- Token vẫn được trả về trong response body
- localStorage/sessionStorage vẫn được sử dụng cho backward compatibility

## Security Considerations

1. **HttpOnly**: Ngăn chặn XSS attacks
2. **Secure**: Đảm bảo HTTPS trong production
3. **SameSite**: Ngăn chặn CSRF attacks
4. **Expiration**: Token tự động expire sau 365 ngày
5. **Domain**: Cookie chỉ valid cho domain đã set

## Future Improvements

1. Implement refresh token mechanism
2. Add token rotation
3. Implement session management
4. Add rate limiting for authentication endpoints
5. Implement multi-factor authentication
