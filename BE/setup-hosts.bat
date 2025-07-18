@echo off
echo Adding hosts entries for multi-tenant setup...
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator...
) else (
    echo This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Add hosts entries
echo 127.0.0.1 site1.localhost >> C:\Windows\System32\drivers\etc\hosts
echo 127.0.0.1 site2.localhost >> C:\Windows\System32\drivers\etc\hosts
echo 127.0.0.1 affiliate1.localhost >> C:\Windows\System32\drivers\etc\hosts
echo 127.0.0.1 affiliate2.localhost >> C:\Windows\System32\drivers\etc\hosts
echo 127.0.0.1 partner.localhost >> C:\Windows\System32\drivers\etc\hosts

echo.
echo ✅ Hosts entries added successfully!
echo.
echo You can now access:
echo - Main Site: http://localhost:5173
echo - Site 1: http://site1.localhost:5173
echo - Site 2: http://site2.localhost:5173
echo - Affiliate 1: http://affiliate1.localhost:5173
echo - Affiliate 2: http://affiliate2.localhost:5173
echo - Partner: http://partner.localhost:5173
echo.
echo Note: Make sure both Backend (port 3000) and Frontend (port 5173) are running
pause
