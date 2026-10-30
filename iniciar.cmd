@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  if exist ".tools\node-v22.23.2-win-x64\node.exe" (
    set "PATH=%~dp0.tools\node-v22.23.2-win-x64;%PATH%"
  ) else (
    echo Instale o Node.js 22.12 ou superior antes de iniciar.
    pause
    exit /b 1
  )
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm.cmd install
  if errorlevel 1 exit /b 1
)
call npm.cmd run dev
