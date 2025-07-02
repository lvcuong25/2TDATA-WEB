# Site Detection and Forbidden Header Fixes

## Issues Resolved

### 1. Forbidden Header Error
**Problem**: Frontend was getting "Attempt to set a forbidden header was denied: Host" error.

**Root Cause**: The `fetch()` call in `MyService.jsx` (line 98) was not properly configured for CORS requests.

**Fix Applied**:
- Updated the fetch call to include proper headers and CORS mode
- Added error handling to prevent uncaught promises
- Removed any attempts to manually set Host headers

### 2. Site Detection Logic Improvements
**Problem**: Site detection middleware wasn't correctly identifying affiliate sites like `site1.localhost`.

**Root Cause**: The middleware logic had edge cases in localhost pattern matching.

**Fixes Applied**:
- Improved hostname pattern matching for localhost environments
- Added alternative localhost pattern testing (with/without .localhost suffix)
- Enhanced debug logging for better troubleshooting
- Used direct MongoDB queries instead of static methods for better reliability

### 3. Frontend Axios Configuration
**Problem**: Axios instances might have been conflicting with multi-site detection.

**Fix Applied**:
- Cleaned up axios instance configuration
- Removed deprecated header comments and configurations
- Ensured proper dynamic base URL generation
- Let the browser handle Host headers naturally

## Files Modified

### Backend Files:
1. `BE/src/middlewares/siteDetection.js`
   - Enhanced hostname detection logic
   - Improved localhost pattern matching
   - Better error handling and logging

### Frontend Files:
1. `FE/src/components/MyService.jsx`
   - Fixed fetch() call with proper CORS handling
   - Added error handling for link update requests

2. `FE/src/axios/axiosInstance.js`
   - Cleaned up configuration
   - Removed manual header manipulation
   - Improved documentation

## Testing Instructions

### 1. Database Verification
```bash
# Verify database contains correct site mappings
cd "G:\VsCode\Code\Job\2TDATA-WEB"
node BE/check-sites.js
```

Expected output should show:
- `site1.localhost` maps to "TechHub Affiliate"
- `localhost` maps to "2TDATA - Master Platform"

### 2. Site Detection Testing
```bash
# Start the test server
node BE/test-site-detection-fix.js
```

Then test these URLs:
- http://localhost:3001/test-site-detection (should detect main site)
- http://site1.localhost:3001/test-site-detection (should detect TechHub Affiliate)

### 3. Full Application Testing
1. Start your Docker containers:
   ```bash
   docker-compose up -d
   ```

2. Test site detection in the browser:
   - Open http://localhost:3000 (main site)
   - Open http://site1.localhost:3000 (affiliate site)
   - Check browser console for site detection logs
   - Verify no "forbidden header" errors

### 4. API Endpoint Testing
Test the current site detection endpoint:
```bash
# Main site
curl -H "Host: localhost" http://localhost:3000/api/sites/current

# Affiliate site
curl -H "Host: site1.localhost" http://localhost:3000/api/sites/current
```

## Expected Behavior

### Correct Site Detection:
- `localhost` → "2TDATA - Master Platform"
- `site1.localhost` → "TechHub Affiliate"
- `techhub.localhost` → "TechHub Affiliate"
- `site2.localhost` → "FinanceFlow Affiliate"

### No More Forbidden Header Errors:
- All fetch() calls should work without browser security errors
- Axios requests should work properly with natural Host headers
- No manual Host header manipulation

## Debug Information

If issues persist:

1. **Check Browser Console**: Look for site detection logs and any remaining forbidden header errors

2. **Check Backend Logs**: The site detection middleware now provides detailed logging:
   ```
   🔍 detectSiteMiddleware called for: /sites/current
   🌐 Processing hostname: site1.localhost:3000 -> site1.localhost
   ✅ Found site "TechHub Affiliate" with pattern "site1.localhost"
   ```

3. **Verify Database**: Ensure all affiliate sites have the correct domain mappings

4. **Test with curl**: Use curl commands to test site detection without frontend interference

## Notes

- The fixes maintain backward compatibility with existing functionality
- All changes follow the existing code patterns and conventions
- Enhanced error handling prevents crashes during site detection failures
- Improved logging helps with troubleshooting site detection issues

## Next Steps

1. Test the application with the fixes applied
2. Monitor logs for any remaining issues
3. Verify that affiliate sites now load with correct branding and configuration
4. Confirm that the forbidden header error is resolved
