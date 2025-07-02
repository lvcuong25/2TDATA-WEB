# Test script for affiliate site upload functionality
Write-Host "🚀 Starting affiliate site upload test..." -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:3000/api"
$techHubHost = "techhub.localhost"
$loginData = @{
    email = "superadmin@2tdata.com"
    password = "admin123"
} | ConvertTo-Json -Compress

try {
    # Step 1: Login to get token
    Write-Host "`n1️⃣ Logging in..." -ForegroundColor Cyan
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/sign-in" -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "Login response: $($loginResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
    
    # Check if login was successful (different response format)
    if ($loginResponse.message -eq "Đăng nhập thành công!" -and $loginResponse.accessToken) {
        $token = $loginResponse.accessToken
    } elseif ($loginResponse.success -and $loginResponse.data.accessToken) {
        $token = $loginResponse.data.accessToken
    } else {
        throw "Login failed: $($loginResponse.message)"
    }
    Write-Host "✅ Login successful" -ForegroundColor Green
    
    # Step 2: Get current site info
    Write-Host "`n2️⃣ Getting current site info..." -ForegroundColor Cyan
    $headers = @{
        "Host" = $techHubHost
    }
    
    $siteResponse = Invoke-RestMethod -Uri "$baseUrl/sites/current" -Headers $headers
    
    if (-not $siteResponse.success) {
        throw "Site detection failed: $($siteResponse.message)"
    }
    
    Write-Host "✅ Site detected: $($siteResponse.data.name)" -ForegroundColor Green
    $siteId = $siteResponse.data._id
    
    # Step 3: Test color update (JSON)
    Write-Host "`n3️⃣ Testing color update..." -ForegroundColor Cyan
    $colorData = @{
        theme_config = @{
            primaryColor = "#FF6B6B"
            secondaryColor = "#4ECDC4"
        }
    } | ConvertTo-Json -Depth 3 -Compress
    
    $authHeaders = @{
        "Authorization" = "Bearer $token"
        "Host" = $techHubHost
        "Content-Type" = "application/json"
    }
    
    try {
        $colorResponse = Invoke-RestMethod -Uri "$baseUrl/admin/sites/$siteId" -Method PUT -Body $colorData -Headers $authHeaders
        if ($colorResponse.success) {
            Write-Host "✅ Color update successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Color update failed: $($colorResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Color update error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Yellow
    }
    
    # Step 4: Test authentication for file upload endpoint
    Write-Host "`n4️⃣ Testing file upload endpoint authentication..." -ForegroundColor Cyan
    
    # Create a simple test boundary and body for multipart test
    $boundary = [System.Guid]::NewGuid().ToString()
    $bodyTemplate = @"
--$boundary
Content-Disposition: form-data; name="theme_config"

{"primaryColor":"#10B981","secondaryColor":"#065F46"}
--$boundary--
"@
    
    $uploadHeaders = @{
        "Authorization" = "Bearer $token"
        "Host" = $techHubHost
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    try {
        $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/admin/sites/edit/$siteId" -Method PUT -Body $bodyTemplate -Headers $uploadHeaders
        if ($uploadResponse.success) {
            Write-Host "✅ File upload endpoint authentication successful" -ForegroundColor Green
        } else {
            Write-Host "❌ File upload endpoint failed: $($uploadResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ File upload endpoint error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n🎉 Test completed!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
