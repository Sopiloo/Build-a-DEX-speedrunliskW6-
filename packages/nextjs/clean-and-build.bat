@echo off
echo Cleaning up...

REM Remove cache and build folders
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

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
