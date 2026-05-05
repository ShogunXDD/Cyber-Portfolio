@echo off
echo Launching Scraper application locally...
if not exist "storage.db" type NUL > storage.db

:: Stop any existing instance running on port 8501
for /f "tokens=5" %%a in ('netstat -aon ^| find "8501" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>nul

echo Starting FastAPI Backend...
start "Scraper Backend" cmd /c "python -m uvicorn api:app --host 0.0.0.0 --port 8501"

echo Scraper Backend started!
echo.
echo Scraper UI is accessible at: http://localhost:8501
timeout /t 3 /nobreak >nul
start http://localhost:8501
