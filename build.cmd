@echo off
chcp 65001 >nul
rem ===================================================================
rem  One-click build for Windows: double-click this file.
rem  It renders every blog\*\index.md into HTML pages.
rem ===================================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
echo.
pause
