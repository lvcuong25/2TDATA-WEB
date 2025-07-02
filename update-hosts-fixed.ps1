#!/usr/bin/env pwsh

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires administrator privileges" -ForegroundColor Red
    Write-Host "💡 Run PowerShell as Administrator and try again" -ForegroundColor Yellow
    exit 1
}

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$entries = @(
    # Main development domains
    "127.0.0.1 site1.localhost",
    
    # TechHub Affiliate domains 
    "127.0.0.1 techhub.2tdata.com",
    "127.0.0.1 techhub.localhost",
    "127.0.0.1 partner-tech.2tdata.com",
    
    # FinanceFlow Affiliate domains
    "127.0.0.1 finance.2tdata.com",
    "127.0.0.1 finance.localhost",
    "127.0.0.1 site2.localhost",
    "127.0.0.1 partner-finance.2tdata.com",
    
    # HealthCore Affiliate domains
    "127.0.0.1 health.2tdata.com",
    "127.0.0.1 health.localhost", 
    "127.0.0.1 site3.localhost",
    "127.0.0.1 partner-health.2tdata.com",
    
    # EduPlatform Affiliate domains
    "127.0.0.1 edu.2tdata.com",
    "127.0.0.1 education.localhost",
    "127.0.0.1 site4.localhost", 
    "127.0.0.1 partner-edu.2tdata.com",
    
    # GameZone Affiliate domains
    "127.0.0.1 games.2tdata.com",
    "127.0.0.1 gaming.localhost",
    "127.0.0.1 site5.localhost",
    "127.0.0.1 partner-games.2tdata.com",
    
    # Legacy test domains 
    "127.0.0.1 partner-a.2tdata.com", 
    "127.0.0.1 partner-b.2tdata.com",
    "127.0.0.1 test.example.com"
)

Write-Host "🔧 Updating hosts file..." -ForegroundColor Yellow

# Backup current hosts file
$backupFile = "$hostsFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $hostsFile $backupFile
Write-Host "📄 Backup created: $backupFile" -ForegroundColor Cyan

# Read current hosts file
$currentHosts = Get-Content $hostsFile

# Check which entries already exist
$newEntries = @()
foreach ($entry in $entries) {
    $domain = $entry.Split(' ')[1]
    $exists = $currentHosts | Where-Object { $_ -like "*$domain*" }
    
    if (-not $exists) {
        $newEntries += $entry
        Write-Host "➕ Adding: $entry" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ Already exists: $domain" -ForegroundColor Cyan
    }
}

# Add new entries if any
if ($newEntries.Count -gt 0) {
    try {
        # Add a comment line
        Add-Content -Path $hostsFile -Value ""
        Add-Content -Path $hostsFile -Value "# 2TDATA-WEB Docker domains"
        
        # Add new entries
        foreach ($entry in $newEntries) {
            Add-Content -Path $hostsFile -Value $entry
        }
        
        Write-Host "✅ Hosts file updated successfully!" -ForegroundColor Green
        Write-Host "🔄 You may need to restart your browser for changes to take effect" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to update hosts file: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ All domains already configured in hosts file" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 You can now access affiliate sites:" -ForegroundColor Cyan
Write-Host "  📱 Main:        http://localhost" -ForegroundColor White
Write-Host "  💻 TechHub:     http://techhub.localhost" -ForegroundColor Green
Write-Host "  💰 Finance:     http://finance.localhost" -ForegroundColor Yellow
Write-Host "  🏥 Health:      http://health.localhost" -ForegroundColor Red
Write-Host "  🎓 Education:   http://education.localhost" -ForegroundColor Magenta
Write-Host "  🎮 Gaming:      http://gaming.localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏷️  Production-style domains:" -ForegroundColor Cyan
Write-Host "  http://techhub.2tdata.com" -ForegroundColor White
Write-Host "  http://finance.2tdata.com" -ForegroundColor White
Write-Host "  http://health.2tdata.com" -ForegroundColor White
Write-Host "  http://edu.2tdata.com" -ForegroundColor White
Write-Host "  http://games.2tdata.com" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Docker Services:" -ForegroundColor Yellow
Write-Host "  Frontend: Port 80 (http://localhost)" -ForegroundColor White
Write-Host "  Backend API: Port 3000 (http://localhost:3000/api)" -ForegroundColor White
Write-Host "  MongoDB Express: Port 8081 (http://localhost:8081)" -ForegroundColor White
