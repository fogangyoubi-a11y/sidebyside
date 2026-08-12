@echo off
title SideBySide — Reparation backend
color 0E
echo.
echo  ======================================
echo   SideBySide - Reparation node_modules
echo  ======================================
echo.

cd /d "C:\Users\hp\Desktop\sidebyside\backend"

echo Suppression de node_modules...
rmdir /s /q node_modules

echo.
echo Reinstallation propre des dependances...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERREUR: npm install a echoue.
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
echo Creation de la base de donnees SQLite...
call npx prisma db push --force-reset
if %ERRORLEVEL% neq 0 (
    echo ERREUR: prisma db push a echoue.
    pause
    exit /b 1
)

echo.
echo Insertion des donnees de test...
call npx ts-node src/seed.ts
if %ERRORLEVEL% neq 0 (
    echo ERREUR: seed a echoue.
    pause
    exit /b 1
)

echo.
echo  ======================================
echo   Backend repare et pret sur port 3000
echo  ======================================
echo.
call npm run dev
