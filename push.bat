@echo off
chcp 65001 >nul
echo ========================================
echo   Push to GitHub - sisamran-web-app
echo ========================================
echo.

cd /d "%~dp0"

:: Stage all changes
git add -A

:: Show status
echo --- Changes ---
git status --short
echo.

:: Ask for commit message
set /p MSG="Commit message (กดEnterใช้ default): "
if "%MSG%"=="" set MSG=Update website

:: Commit and push
git commit -m "%MSG%"
git push

echo.
echo ========================================
echo   Done! Check: https://github.com/srisamran/sisamran-web-app
echo ========================================
pause
