# Logic Redirect Sau Khi Login

## Frontend (FE/src/components/signin.jsx)

### Xử lý redirect với logic ưu tiên:
1. **Nếu có URL param redirect VÀ user KHÔNG phải admin** → dùng URL param
   - Điều kiện: `urlRedirect && data.data.role !== 'super_admin' && data.data.role !== 'site_admin' && data.data.role !== 'admin'`
   - Redirect: `window.location.href = urlRedirect`

2. **Nếu không** → dùng redirect từ backend
   - Nếu có `redirectDomain`: `window.location.href = new URL(redirectPath, redirectDomain)`
   - Nếu không: `window.location.href = redirectPath || '/'`

## Backend (BE/src/controllers/auth.js)

### Logic redirect dựa trên role và site:

1. **Super Admin**
   - `redirectPath = '/admin'`
   - `redirectDomain = 'https://2tdata.com'`
   - Luôn redirect về dashboard của 2tdata.com

2. **Site Admin hoặc Admin**
   - `redirectPath = '/admin'`
   - `redirectDomain = 'https://[domain-của-site]'` (domain đầu tiên trong site.domains)
   - Redirect về dashboard của site họ quản lý

3. **User thường**
   - Nếu không có service: `redirectPath = '/service/my-service'`
   - Nếu có service: `redirectPath = '/'`
   - `redirectDomain = 'https://[domain-của-site]'` (nếu có)

## Hook useAuthRedirect (FE/src/hooks/useAuthRedirect.js)

### Chức năng chính:
- `checkAuthAndRedirect()`: Kiểm tra auth và redirect tự động
- `redirectToLogin()`: Redirect về trang login (có thể kèm redirect param)
- `redirectAfterLogin()`: Xử lý redirect sau khi login thành công

### Protected Routes:
- `/service/my-service`
- `/profile`
- `/admin` và các route con
- `/admin/iframe`, `/admin/users`, `/admin/blogs`, v.v.

### Auth Routes:
- `/login`
- `/logup`
- `/rest-password`

## Tóm tắt Flow:
1. User truy cập protected route → redirect về `/login?redirect=[url-hiện-tại]`
2. User login thành công:
   - Frontend nhận response từ backend với `redirectPath` và `redirectDomain`
   - Nếu user thường và có URL param redirect → dùng URL param
   - Nếu không → dùng logic redirect từ backend theo role
