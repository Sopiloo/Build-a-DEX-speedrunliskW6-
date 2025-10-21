@echo off
echo Building for Vercel...

REM Clean previous build
if exist .next rmdir /s /q .next

REM Build the application
yarn build

if %ERRORLEVEL% EQU 0 (
    echo Build successful! You can now deploy to Vercel.
) else (
    echo Build failed. Please check the error messages above.
    pause
)
