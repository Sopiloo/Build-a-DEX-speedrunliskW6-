@echo off
echo Cleaning up...

REM Supprimer les dossiers de cache
if exist .next rmdir /s /q .next
if exist packages\nextjs\.next rmdir /s /q packages\nextjs\.next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

cd packages\nextjs

echo Installing dependencies...
yarn install --force

echo Building the application...
yarn build

if %ERRORLEVEL% EQU 0 (
    echo Build successful! Starting development server...
    yarn dev
) else (
    echo Build failed. Please check the error messages above.
    pause
)
