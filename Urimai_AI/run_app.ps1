# Urimai AI - One Click Startup Script
Write-Host "🚀 Starting Urimai AI..." -ForegroundColor Cyan

# 1. Start Backend
Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path venv)) {
    Write-Host "Creating Virtual Environment..."
    python -m venv venv
}
.\venv\Scripts\pip install -r requirements.txt
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\python app.py"
Set-Location ..

# 2. Start Frontend Preview
Write-Host "🌐 Opening Frontend..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "✅ Everything is running!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
