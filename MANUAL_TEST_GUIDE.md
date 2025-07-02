# Manual Testing Guide - Affiliate Site Management

## ✅ Status: FIXED
**Issue**: "Authorization header missing" error during logo uploads and color changes
**Root Cause**: Nginx `client_max_body_size` was not configured for file uploads
**Solution**: Added `client_max_body_size 50M;` to nginx configuration

---

## 🧪 Manual Testing Steps

### Prerequisites
1. Ensure Docker containers are running:
   ```powershell
   docker ps
   ```
   Should show `2tdata-frontend` and `2tdata-backend` containers as "Up"

2. Verify hosts file (as Administrator):
   ```
   127.0.0.1 localhost
   127.0.0.1 techhub.localhost
   127.0.0.1 fintech.localhost
   127.0.0.1 site1.localhost
   ```

### Test 1: Site Detection
1. **Main Site**: Open `http://localhost` → Should show "2TDATA - Master Platform"
2. **TechHub Site**: Open `http://techhub.localhost` → Should show "TechHub" branding
3. **Fintech Site**: Open `http://fintech.localhost` → Should show "FinTech Solutions" branding

### Test 2: Admin Access & Authentication
1. Go to `http://localhost/admin`
2. Login with admin credentials:
   - Email: `admin@2tdata.com`
   - Password: `admin123`
3. Navigate to **Sites Management**
4. Click **Edit** on any affiliate site (e.g., TechHub)

### Test 3: Color Change Feature
1. In the site edit form, modify:
   - **Primary Color**: Try `#FF5722` (orange)
   - **Secondary Color**: Try `#2196F3` (blue)
2. Click **Update Site**
3. ✅ **Expected**: Success message, no "authorization header missing" error
4. Visit the affiliate site to verify color changes appear

### Test 4: Logo Upload Feature
1. In the site edit form:
   - Click **Choose File** for logo upload
   - Select a small image file (PNG/JPG, <5MB)
   - Click **Update Site**
2. ✅ **Expected**: 
   - Success message
   - New logo appears in preview
   - No "authorization header missing" error

### Test 5: Cross-Domain Testing
1. Edit site from main domain: `http://localhost/admin/sites/edit/SITE_ID`
2. View changes on affiliate domain: `http://techhub.localhost`
3. ✅ **Expected**: Changes reflect across domains

---

## 🔧 Troubleshooting

### If you see "Authorization header missing":
1. Check browser DevTools → Network tab
2. Verify requests include `Authorization: Bearer TOKEN`
3. Try logging out and back in

### If uploads fail:
1. Check file size (must be <50MB)
2. Check file format (PNG, JPG, WEBP supported)
3. Check Docker logs: `docker logs 2tdata-backend`

### If site detection fails:
1. Verify hosts file entries
2. Clear browser cache
3. Check backend logs for site detection debug info

---

## 🎯 Success Criteria

✅ **All tests pass when**:
- No 403 errors in browser DevTools
- No "authorization header missing" errors
- Logo uploads complete successfully
- Color changes apply immediately
- Multi-site routing works correctly
- Changes persist after page refresh

---

## 📋 Quick Verification Commands

```powershell
# Check containers status
docker ps

# Monitor backend logs
docker logs -f 2tdata-backend

# Monitor frontend logs  
docker logs -f 2tdata-frontend

# Test API endpoint
$headers = @{'Host' = 'techhub.localhost'}
Invoke-WebRequest -Uri 'http://localhost/api/sites/current' -Headers $headers
```

---

**Last Updated**: July 1, 2025
**Status**: ✅ Ready for testing
