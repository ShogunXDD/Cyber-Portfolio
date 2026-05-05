@echo off
echo Stopping Scraper backend...
for /f "tokens=5" %%a in ('netstat -aon ^| find "8501" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>nul
echo Backend stopped successfully!
pause
