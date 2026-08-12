@echo off
title SideBySide — Migration base de donnees
color 0B
echo.
echo  ======================================
echo   SideBySide - Migration Prisma
echo  ======================================
echo.

cd /d "C:\Users\hp\Desktop\sidebyside\backend"

echo Mise a jour du schema (sans reset)...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo ERREUR: prisma db push a echoue.
    pause
    exit /b 1
)

echo.
echo Generation du client Prisma...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ERREUR: prisma generate a echoue.
    pause
    exit /b 1
)

echo.
echo  ======================================
echo   Migration terminee ! Relance le backend.
echo  ======================================
echo.
pause
