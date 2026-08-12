@echo off
title SideBySide — Backend
color 0A
echo.
echo  ======================================
echo   SideBySide - Demarrage backend
echo  ======================================
echo.

cd /d "C:\Users\hp\Desktop\sidebyside\backend"

echo Demarrage du serveur sur port 3000...
echo (Laisse cette fenetre ouverte)
echo.
call npm run dev
