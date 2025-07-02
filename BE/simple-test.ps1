# Simple Test Script for Affiliate Sites
$baseUrl = "http://localhost:3000/api"

Write-Host "🚀 Testing Affiliate Sites" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed" -ForegroundColor Red
}

# Test 2: Create Super Admin
Write-Host "`n2. Creating Super Admin..." -ForegroundColor Yellow
$superAdminData = @{
    email = "superadmin@test.com"
    password = "admin123"
    role = "super_admin"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/auth/sign-up" -Method POST -Body $superAdminData -ContentType "application/json"
    $token = $signupResponse.accessToken
    Write-Host "✅ Super Admin Created!" -ForegroundColor Green
} catch {
    Write-Host "❌ Super Admin Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create Main Site
Write-Host "`n3. Creating Main Site..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$siteData = @{
    name = "Main Site"
    domains = @("localhost", "main.test.com")
} | ConvertTo-Json

try {
    $siteResponse = Invoke-RestMethod -Uri "$baseUrl/sites" -Method POST -Body $siteData -Headers $headers
    Write-Host "✅ Main Site Created: $($siteResponse.data.name)" -ForegroundColor Green
    Write-Host "   Domains: $($siteResponse.data.domains -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Site Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Basic Test Completed!" -ForegroundColor Green
