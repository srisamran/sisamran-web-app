@echo off
chcp 65001 > nul
echo =======================================================
echo   UD-Local Companion Server (Sync & Accept Service)
echo   * กรุณาเปิดหน้าต่างนี้ทิ้งไว้เพื่อใช้งานระบบดึงและรับเอกสาร *
echo =======================================================
node sync_udlocal.js
pause
