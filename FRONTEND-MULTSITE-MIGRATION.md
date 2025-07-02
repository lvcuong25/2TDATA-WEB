# 🌐 Frontend Multi-Site Migration Guide

## Overview

This guide documents the migration from manual Host header handling to proper multi-site support in the frontend application.

## 🔧 Changes Made

### 1. ✅ Removed Manual Host Header Setting

**Problem**: The frontend was manually setting `X-Host` headers, which interfered with the browser's natural Host header handling.

**Solution**: Updated `FE/src/axios/axiosInstance.js` to remove manual header setting and let the browser handle Host headers naturally.

#### Before:
```javascript
// ❌ Manual Host header setting
config.headers['X-Host'] = window.location.hostname;
```

#### After:
```javascript
// ✅ Removed manual X-Host header setting
// The browser automatically handles Host headers properly for same-origin requests
// The backend site detection middleware will use the natural Host header
```

### 2. ✅ Dynamic Base URL Configuration

**Updated axios instance to use dynamic base URLs** based on the current domain:

```javascript
const getApiBaseURL = () => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};
```

This allows the frontend to work across different affiliate domains without hardcoded URLs.

### 3. ✅ Added Affiliate Domain Support

**Updated hosts file** (`update-hosts.ps1`) to include all affiliate subdomains:

#### Affiliate Sites:
- **TechHub**: `techhub.localhost:3000`, `techhub.2tdata.com:3000`
- **Finance**: `finance.localhost:3000`, `finance.2tdata.com:3000`
- **Health**: `health.localhost:3000`, `health.2tdata.com:3000`
- **Education**: `education.localhost:3000`, `edu.2tdata.com:3000`
- **Gaming**: `gaming.localhost:3000`, `games.2tdata.com:3000`

## 🚀 How to Use

### 1. Update Hosts File

Run the PowerShell script as Administrator:

```powershell
# Run as Administrator
.\update-hosts.ps1
```

This will add all affiliate domains to your system hosts file.

### 2. Start the Application

```bash
# Start backend
npm run dev

# Start frontend (in another terminal)
cd FE
npm start
```

### 3. Access Affiliate Sites

You can now visit any affiliate site and the frontend will automatically:
- Use the correct API base URL for that domain
- Let the browser set the proper Host header
- Allow the backend to detect the correct site

#### Examples:
```
http://localhost:3000              → Main 2TDATA site
http://techhub.localhost:3000      → TechHub affiliate
http://finance.localhost:3000      → Finance affiliate
http://health.localhost:3000       → Health affiliate
http://education.localhost:3000    → Education affiliate
http://gaming.localhost:3000       → Gaming affiliate
```

## 🔄 Migration for Existing Components

### Recommended: Use API Client Helper

For new development, use the recommended API client helper:

```javascript
// ✅ Recommended approach
import apiClient from '../../BE/frontend-helpers/api-client.js';

// Automatically handles domain detection
const siteInfo = await apiClient.getCurrentSite();
const users = await apiClient.getUsers();
```

### Legacy: Updated Axios Instance

Existing components using the axios instance will work but consider migrating:

```javascript
// ⚠️ Still works but deprecated
import axiosInstance from '../axios/axiosInstance.js';

// Now uses dynamic base URL automatically
const response = await axiosInstance.get('/sites/current');
```

## 🔍 Backend Site Detection

The backend site detection middleware now works properly:

1. **Natural Host Header**: Browser sends correct Host header
2. **Site Detection**: Backend uses `req.get('host')` naturally  
3. **Domain Matching**: Finds correct site based on hostname
4. **Context Setting**: Sets `req.site` for the rest of the request

### Site Detection Flow:
```
Browser → http://techhub.localhost:3000/api/sites/current
Browser sets: Host: techhub.localhost:3000
Backend detects: hostname = "techhub.localhost"
Backend finds: TechHub Affiliate site
Backend sets: req.site = TechHub site object
```

## ✅ Benefits

1. **Native Browser Behavior**: No more manual header manipulation
2. **Domain Flexibility**: Works with any configured affiliate domain
3. **Development/Production Parity**: Same code works in both environments
4. **Cleaner Code**: Removed hacky header workarounds
5. **Better Performance**: Browser handles headers optimally

## 🔧 Testing

### Test Different Sites

1. Visit each affiliate domain
2. Check browser devtools → Network tab
3. Verify API calls use correct base URL
4. Confirm backend returns correct site data

### Test API Calls

```javascript
// Should work from any domain
console.log('Current domain:', window.location.hostname);

// API call will use correct base URL automatically
fetch('/api/sites/current')
  .then(res => res.json())
  .then(data => console.log('Site:', data.data.name));
```

## 🐛 Troubleshooting

### DNS Not Resolving

If affiliate domains don't work:

1. **Run update-hosts.ps1 as Administrator**
2. **Clear browser DNS cache**: `chrome://net-internals/#dns`
3. **Restart browser** after hosts file changes
4. **Check hosts file**: `C:\Windows\System32\drivers\etc\hosts`

### API Calls Failing

If API calls fail on affiliate domains:

1. **Check browser console** for CORS errors
2. **Verify base URL** in Network tab devtools
3. **Check backend logs** for site detection issues
4. **Ensure database has affiliate sites** (run `setup-affiliate-sites.js`)

### Manual Header Issues

If you see manual header setting in other files:

1. **Search for `X-Host`** in the codebase
2. **Remove manual header setting**
3. **Use dynamic base URL** instead
4. **Test with different domains**

## 📋 Next Steps

1. **Review Components**: Check for other manual header usage
2. **Migrate to API Client**: Update components to use the recommended helper
3. **Test Production**: Verify setup works with production domains
4. **Update Documentation**: Keep this guide updated with changes

## 🔗 Related Files

- `FE/src/axios/axiosInstance.js` - Updated axios configuration
- `BE/frontend-helpers/api-client.js` - Recommended API client
- `BE/src/middlewares/siteDetection.js` - Backend site detection
- `update-hosts.ps1` - Hosts file management
- `BE/db-management/setup-affiliate-sites.js` - Database setup

---

**Note**: This migration ensures proper multi-site functionality while maintaining compatibility with existing code. The frontend now works seamlessly across all affiliate domains without manual header manipulation.
