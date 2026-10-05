@echo off
title WEB YAI - Dev Server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js belum terinstall / tidak ada di PATH.
    echo Download di https://nodejs.org lalu jalankan ulang file ini.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo node_modules tidak ditemukan, menjalankan npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install gagal.
        pause
        exit /b 1
    )
)

echo Membuka http://localhost:3000 ...
start "" /b cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"

call npm run dev

echo.
echo Server berhenti.
pause
