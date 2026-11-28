@echo off
setlocal
REM Shortcut runner untuk deploy.sh di terminal Windows (CMD / PowerShell)
if exist "C:\Program Files\Git\bin\bash.exe" (
  "C:\Program Files\Git\bin\bash.exe" "%~dp0deploy.sh" %*
) else (
  where bash >nul 2>nul
  if %errorlevel% equ 0 (
    bash "%~dp0deploy.sh" %*
  ) else (
    echo [ERROR] Bash tidak ditemukan di sistem. Menjalankan fallback npm deploy:frontend...
    npm run deploy:frontend
  )
)
