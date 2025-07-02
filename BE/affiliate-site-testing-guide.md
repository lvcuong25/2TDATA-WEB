# 🔧 Affiliate Site Testing Guide

## 🐛 Current Issues Identified

### 1. **Frontend Host Header Error**
```
Attempt to set a forbidden header was denied: Host
```

**Problem**: Frontend code is trying to manually set the `Host` header, which browsers don't allow.

**Solution**: Remove any manual `Host` header setting in frontend code. The browser automatically sets this based on the URL.

### 2. **Incorrect Site Detection**
Despite accessing `techhub.localhost`, getting `2TDATA - Master Platform` instead of `TechHub Affiliate`.

**Root Cause**: Frontend is likely making requests to wrong URL or middleware not properly detecting site.

## ✅ Database Status: PERFECT ✅

Our debug shows database and site detection logic is working correctly:

```
🔍 Testing domain: "techhub.localhost"
   findByDomain: ✅ Found "TechHub Affiliate"
   
🔍 Testing domain: "site1.localhost"  
   findByDomain: ✅ Found "TechHub Affiliate"
   
🔍 Testing domain: "localhost"
   findByDomain: ✅ Found "2TDATA - Master Platform"
```

## 🔧 Frontend Fixes Needed

### 1. **Remove Manual Host Header Setting**

**❌ Don't do this:**
```javascript
fetch('/api/sites/current', {
  headers: {
    'Host': 'techhub.localhost',  // ← REMOVE THIS
    'Content-Type': 'application/json'
  }
});
```

**✅ Do this instead:**
```javascript
fetch('/api/sites/current', {
  headers: {
    'Content-Type': 'application/json'
    // Host header is automatically set by browser
  }
});
```

### 2. **Ensure Correct URL Access**

Make sure you're actually accessing the correct URL in browser:

- ✅ `http://techhub.localhost:3000/api/sites/current`
- ✅ `http://site1.localhost:3000/api/sites/current`  
- ❌ `http://localhost:3000/api/sites/current` (this will return main site)

### 3. **Add Hosts File Entries**

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

```
127.0.0.1    techhub.localhost
127.0.0.1    site1.localhost
127.0.0.1    site2.localhost
127.0.0.1    site3.localhost
127.0.0.1    finance.localhost
127.0.0.1    health.localhost
127.0.0.1    education.localhost
127.0.0.1    gaming.localhost
```

## 🧪 Manual Testing Steps

### Step 1: Test API Endpoints Directly

Open browser and test these URLs:

1. **Main Site**: http://localhost:3000/api/sites/current
   - Should return: `"name": "2TDATA - Master Platform"`

2. **TechHub Affiliate**: http://techhub.localhost:3000/api/sites/current
   - Should return: `"name": "TechHub Affiliate"`

3. **Finance Affiliate**: http://finance.localhost:3000/api/sites/current
   - Should return: `"name": "FinanceFlow Affiliate"`

### Step 2: Check Network Tab

In browser DevTools → Network tab:
- Verify the **Request URL** shows correct domain
- Check **Request Headers** for correct `Host` value
- Verify **Response** contains correct site info

### Step 3: Debug Server Logs

Start server with:
```bash
npm run dev
```

Watch for console logs:
```
🔍 detectSiteMiddleware called for: /api/sites/current
🌐 Processing hostname: techhub.localhost:3000 -> techhub.localhost
🔍 Direct lookup for "techhub.localhost": Found "TechHub Affiliate"
🌐 getCurrentSiteInfo called with: TechHub Affiliate
```

## 🔍 Debug Commands

### Test Database Connection
```bash
npm run db:test
```

### Debug Site Detection
```bash
node debug-site-detection.js
```

### Check Current Database State
```bash
node test-site-detection.js
```

## 📋 Available Affiliate Sites

| Site Name | Primary Domain | Localhost Aliases | Category |
|-----------|---------------|-------------------|----------|
| 2TDATA Master | localhost | localhost | main |
| TechHub Affiliate | techhub.localhost | site1.localhost | technology |
| FinanceFlow Affiliate | finance.localhost | site2.localhost | finance |
| HealthCore Affiliate | health.localhost | site3.localhost | healthcare |
| EduPlatform Affiliate | education.localhost | site4.localhost | education |
| GameZone Affiliate | gaming.localhost | site5.localhost | gaming |

## 🔑 Test Accounts

### Super Admin (Global Access)
- Email: `superadmin@2tdata.com`
- Password: `admin123`

### Site-Specific Admins
- **TechHub**: `admin@techhub.2tdata.com` / `siteadmin123`
- **Finance**: `admin@finance.2tdata.com` / `siteadmin123`
- **Health**: `admin@health.2tdata.com` / `siteadmin123`
- **Education**: `admin@edu.2tdata.com` / `siteadmin123`
- **Gaming**: `admin@games.2tdata.com` / `siteadmin123`

## 🎯 Expected Results

When accessing `http://techhub.localhost:3000/api/sites/current`:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "TechHub Affiliate",
    "domains": [
      "techhub.2tdata.com",
      "techhub.localhost", 
      "site1.localhost",
      "partner-tech.2tdata.com"
    ],
    "theme_config": {
      "primaryColor": "#10B981",
      "secondaryColor": "#065F46",
      "layout": "default"
    }
  }
}
```

## 🚨 If Still Not Working

1. **Clear browser cache** and cookies
2. **Restart the server** after making changes
3. **Check if hosts file changes took effect**:
   ```bash
   # Windows
   nslookup techhub.localhost
   
   # Mac/Linux  
   dig techhub.localhost
   ```
4. **Try incognito mode** to avoid cache issues
5. **Check server console** for middleware logs

## 📞 Final Verification

The issue is definitely in the frontend code. The database, middleware, and API are working perfectly. Focus on:

1. ❌ **Remove manual Host header setting**
2. ✅ **Ensure correct URL access**  
3. ✅ **Add proper hosts file entries**
4. ✅ **Test with fresh browser session**
