# Test Script for 2TDATA-WEB Affiliate Sites Management
# Run this script to test creating and managing affiliate sites

$baseUrl = "http://localhost:3000/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "🚀 Testing 2TDATA-WEB Affiliate Site Management" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Step 1: Create a Super Admin User
Write-Host "`n📝 Step 1: Creating Super Admin User..." -ForegroundColor Yellow

$superAdminData = @{
    email = "superadmin@2tdata.com"
    password = "SuperAdmin123!"
    role = "super_admin"
    site_id = $null  # Super admin không cần site_id cụ thể
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/auth/sign-up" -Method POST -Body $superAdminData -Headers $headers
    Write-Host "✅ Super Admin created successfully!" -ForegroundColor Green
    Write-Host "Email: superadmin@2tdata.com" -ForegroundColor Cyan
    $superAdminToken = $signupResponse.accessToken
} catch {
    Write-Host "❌ Failed to create Super Admin:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Login as Super Admin to get fresh token
Write-Host "`n🔐 Step 2: Logging in as Super Admin..." -ForegroundColor Yellow

$loginData = @{
    email = "superadmin@2tdata.com"
    password = "SuperAdmin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/sign-in" -Method POST -Body $loginData -Headers $headers
    $superAdminToken = $loginResponse.accessToken
    Write-Host "✅ Super Admin logged in successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to login as Super Admin:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Prepare headers with authorization
$authHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $superAdminToken"
}

# Step 3: Create First Affiliate Site (Main Site)
Write-Host "`n🏗️ Step 3: Creating Main Affiliate Site..." -ForegroundColor Yellow

$mainSiteData = @{
    name = "2TDATA Main Site"
    domains = @("localhost", "2tdata.com", "www.2tdata.com")
    theme_config = @{
        primaryColor = "#3B82F6"
        secondaryColor = "#1F2937"
        layout = "modern"
    }
    logo_url = "https://example.com/logo.png"
    settings = @{
        allowRegistration = $true
        requireEmailVerification = $false
        timezone = "Asia/Ho_Chi_Minh"
        language = "vi"
        maxUsers = 10000
    }
} | ConvertTo-Json -Depth 3

try {
    $mainSiteResponse = Invoke-RestMethod -Uri "$baseUrl/sites" -Method POST -Body $mainSiteData -Headers $authHeaders
    Write-Host "✅ Main site created successfully!" -ForegroundColor Green
    Write-Host "Site ID: $($mainSiteResponse.data._id)" -ForegroundColor Cyan
    Write-Host "Domains: $($mainSiteResponse.data.domains -join ', ')" -ForegroundColor Cyan
    $mainSiteId = $mainSiteResponse.data._id
} catch {
    Write-Host "❌ Failed to create main site:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Step 4: Create Affiliate Site 1
Write-Host "`n🏗️ Step 4: Creating Affiliate Site 1..." -ForegroundColor Yellow

$affiliateSite1Data = @{
    name = "Affiliate Partner A"
    domains = @("partner-a.2tdata.com", "partnera.com")
    theme_config = @{
        primaryColor = "#10B981"
        secondaryColor = "#065F46"
        layout = "classic"
    }
    settings = @{
        allowRegistration = $true
        requireEmailVerification = $true
        timezone = "Asia/Ho_Chi_Minh"
        language = "vi"
        maxUsers = 1000
    }
} | ConvertTo-Json -Depth 3

try {
    $affiliate1Response = Invoke-RestMethod -Uri "$baseUrl/sites" -Method POST -Body $affiliateSite1Data -Headers $authHeaders
    Write-Host "✅ Affiliate Site 1 created successfully!" -ForegroundColor Green
    Write-Host "Site ID: $($affiliate1Response.data._id)" -ForegroundColor Cyan
    Write-Host "Domains: $($affiliate1Response.data.domains -join ', ')" -ForegroundColor Cyan
    $affiliate1Id = $affiliate1Response.data._id
} catch {
    Write-Host "❌ Failed to create affiliate site 1:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Step 5: Create Affiliate Site 2
Write-Host "`n🏗️ Step 5: Creating Affiliate Site 2..." -ForegroundColor Yellow

$affiliateSite2Data = @{
    name = "Affiliate Partner B"
    domains = @("partner-b.2tdata.com", "partnerb.com")
    theme_config = @{
        primaryColor = "#8B5CF6"
        secondaryColor = "#5B21B6"
        layout = "default"
    }
    settings = @{
        allowRegistration = $true
        requireEmailVerification = $false
        timezone = "Asia/Ho_Chi_Minh"
        language = "en"
        maxUsers = 500
    }
} | ConvertTo-Json -Depth 3

try {
    $affiliate2Response = Invoke-RestMethod -Uri "$baseUrl/sites" -Method POST -Body $affiliateSite2Data -Headers $authHeaders
    Write-Host "✅ Affiliate Site 2 created successfully!" -ForegroundColor Green
    Write-Host "Site ID: $($affiliate2Response.data._id)" -ForegroundColor Cyan
    Write-Host "Domains: $($affiliate2Response.data.domains -join ', ')" -ForegroundColor Cyan
    $affiliate2Id = $affiliate2Response.data._id
} catch {
    Write-Host "❌ Failed to create affiliate site 2:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Step 6: List All Sites
Write-Host "`n📋 Step 6: Listing All Sites..." -ForegroundColor Yellow

try {
    $allSitesResponse = Invoke-RestMethod -Uri "$baseUrl/sites" -Method GET -Headers $authHeaders
    Write-Host "✅ Retrieved all sites successfully!" -ForegroundColor Green
    Write-Host "Total Sites: $($allSitesResponse.pagination.totalDocs)" -ForegroundColor Cyan
    
    foreach ($site in $allSitesResponse.data) {
        Write-Host "`n  📍 Site: $($site.name)" -ForegroundColor White
        Write-Host "     ID: $($site._id)" -ForegroundColor Gray
        Write-Host "     Domains: $($site.domains -join ', ')" -ForegroundColor Gray
        Write-Host "     Status: $($site.status)" -ForegroundColor Gray
        Write-Host "     Created: $($site.createdAt)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to list sites:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Step 7: Add Additional Domain to a Site
if ($affiliate1Id) {
    Write-Host "`n🌐 Step 7: Adding additional domain to Affiliate Site 1..." -ForegroundColor Yellow
    
    $addDomainData = @{
        domain = "new-domain.partner-a.com"
    } | ConvertTo-Json
    
    try {
        $addDomainResponse = Invoke-RestMethod -Uri "$baseUrl/sites/$affiliate1Id/domains" -Method POST -Body $addDomainData -Headers $authHeaders
        Write-Host "✅ Domain added successfully!" -ForegroundColor Green
        Write-Host "Updated domains: $($addDomainResponse.data.domains -join ', ')" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Failed to add domain:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Step 8: Create Site Admin User for Affiliate Site 1
if ($affiliate1Id) {
    Write-Host "`n👨‍💼 Step 8: Creating Site Admin for Affiliate Site 1..." -ForegroundColor Yellow
    
    $siteAdminData = @{
        email = "admin@partner-a.com"
        password = "SiteAdmin123!"
        role = "admin"
        site_id = $affiliate1Id
    } | ConvertTo-Json
    
    try {
        $siteAdminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/sign-up" -Method POST -Body $siteAdminData -Headers $headers
        Write-Host "✅ Site Admin created successfully!" -ForegroundColor Green
        Write-Host "Email: admin@partner-a.com" -ForegroundColor Cyan
        $siteAdminId = $siteAdminResponse.data._id
    } catch {
        Write-Host "❌ Failed to create site admin:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Step 9: Test Site Current Info (Public Endpoint)
Write-Host "`n🔍 Step 9: Testing Site Current Info..." -ForegroundColor Yellow

try {
    $currentSiteResponse = Invoke-RestMethod -Uri "$baseUrl/sites/current" -Method GET -Headers $headers
    Write-Host "✅ Current site info retrieved!" -ForegroundColor Green
    Write-Host "Site: $($currentSiteResponse.data.name)" -ForegroundColor Cyan
    Write-Host "Domains: $($currentSiteResponse.data.domains -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to get current site info:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Summary
Write-Host "`n🎉 Test Summary" -ForegroundColor Green
Write-Host "==============" -ForegroundColor Green
Write-Host "✅ Super Admin Account: superadmin@2tdata.com" -ForegroundColor White
Write-Host "✅ Multi-tenant sites created with custom domains" -ForegroundColor White
Write-Host "✅ Domain management tested" -ForegroundColor White
Write-Host "✅ Site admin roles configured" -ForegroundColor White
Write-Host "`n🌐 Test URLs:" -ForegroundColor Cyan
Write-Host "   - Main Site: http://localhost:3000/api" -ForegroundColor White
Write-Host "   - MongoDB Express: http://localhost:8081" -ForegroundColor White
Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test frontend with different domain configurations" -ForegroundColor White
Write-Host "   2. Test site-specific user registration" -ForegroundColor White
Write-Host "   3. Test theme customization per site" -ForegroundColor White
Write-Host "   4. Test site admin permissions" -ForegroundColor White

Write-Host "`n🚀 Affiliate Site Management Test Completed!" -ForegroundColor Green
