@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting IntegrityX Backend Server...
echo ========================================
python start_server.py
pause

