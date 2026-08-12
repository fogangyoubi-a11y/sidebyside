@echo off
title SideBySide — Installation complete
color 0A
echo.
echo  ======================================
echo   SideBySide - Installation du backend
echo  ======================================
echo.

cd /d "C:\Users\hp\Desktop\sidebyside\backend"

echo [1/5] Installation des dependances backend...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERREUR: npm install a echoue. Verifiez votre connexion internet.
    pause
    exit /b 1
)

echo.
echo [2/5] Generation du client Prisma...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ERREUR: prisma generate a echoue.
    pause
    exit /b 1
)

echo.
echo [3/5] Creation de la base de donnees SQLite...
call npx prisma db push --force-reset
if %ERRORLEVEL% neq 0 (
    echo ERREUR: prisma db push a echoue.
    pause
    exit /b 1
)

echo.
echo [4/5] Insertion des donnees de test...
call npx ts-node src/seed.ts
if %ERRORLEVEL% neq 0 (
    echo ERREUR: seed a echoue.
    pause
    exit /b 1
)

echo.
echo [5/5] Demarrage du backend (port 3000)...
echo.
echo  ======================================
echo   Backend pret sur http://localhost:3000
echo   Frontend: lancez "npm run dev" dans
echo   C:\Users\hp\Desktop\sidebyside
echo  ======================================
echo.
call npm run dev
