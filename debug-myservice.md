# Debug MyService Component

## Các vấn đề có thể xảy ra:

### 1. Access Token Issues
- Token không được load từ localStorage
- Token đã hết hạn
- Token không được gửi đúng cách trong request

### 2. User Data Issues
- currentUser không được load
- User ID không tồn tại
- User không có quyền truy cập

### 3. Service Data Issues
- Services không được load từ API
- authorizedLinks không tồn tại
- Service status không đúng

### 4. Webhook Issues
- Webhook URL không accessible
- CORS issues với webhook
- Network timeout

## Cách debug:

### 1. Kiểm tra Console Logs
```javascript
// Mở browser console và kiểm tra:
console.log('Access token loaded:', token ? 'Present' : 'Missing');
console.log('Current user:', currentUser);
console.log('User services data:', userData);
console.log('Authorized link for service:', serviceName, link);
```

### 2. Kiểm tra Network Tab
- Xem API calls có thành công không
- Kiểm tra response data
- Xem có lỗi CORS không

### 3. Kiểm tra Local Storage
```javascript
// Trong browser console:
localStorage.getItem('accessToken')
sessionStorage.getItem('accessToken')
```

### 4. Test API Endpoints
```bash
# Test user services endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/user/USER_ID/services
```

## Các thay đổi đã thực hiện:

### 1. Improved Error Handling
- Webhook failure không block redirect
- Better error messages cho user
- Fallback token sources

### 2. Better Debug Logging
- Log access token status
- Log user data
- Log authorized links

### 3. UI Improvements
- Disable button khi không có link
- Show different text cho disabled state
- Better visual feedback

### 4. Token Management
- Try multiple token sources
- Clear error messages khi thiếu token
- Automatic redirect to login nếu cần

## Testing Steps:

1. **Check if user is logged in**
   - Verify currentUser exists
   - Verify accessToken exists

2. **Check if services are loaded**
   - Verify userData exists
   - Verify services array is not empty

3. **Check if authorized links exist**
   - Verify service.authorizedLinks exists
   - Verify at least one link is present

4. **Test button click**
   - Click button and check console logs
   - Verify redirect URL is generated
   - Check if webhook call succeeds (optional)

## Common Issues and Solutions:

### Issue: Button not clickable
**Solution**: Check if authorizedLinks exist for the service

### Issue: "Missing access token" error
**Solution**: Re-login to get fresh token

### Issue: Webhook fails
**Solution**: Webhook is optional, redirect should still work

### Issue: No services shown
**Solution**: Check API response and user permissions

### Issue: CORS errors
**Solution**: Check nginx configuration and CORS headers
