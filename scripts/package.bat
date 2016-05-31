@echo off

FOR /F "delims=" %%i in ('node scripts/details.js COMMIT') do call SET COMMIT=%%i
FOR /F "delims=" %%i in ('node scripts/details.js NAME') do call SET PACKAGE_NAME=%%i
FOR /F "delims=" %%i in ('node scripts/details.js VERSION') do call SET PACKAGE_VERSION=%%i

SET FILE_NAME=%PACKAGE_NAME%-%PACKAGE_VERSION%-%COMMIT%-win32
ECHO %FILE_NAME%
:: Clean the build directory
RMDIR /S /Q build
MKDIR build
MKDIR build\%PACKAGE_VERSION%

:: Do a git archive and a production install
:: to have cleanest output
git archive --format=zip %COMMIT% -o build\%PACKAGE_VERSION%\temp.zip

CD build\%PACKAGE_VERSION%
7z e temp.zip -o%cd%\%PACKAGE_NAME%

CD %PACKAGE_NAME%
call npm install --production
ECHO 'Installed NPM Dependencies'

timeout /t 2 /nobreak > NUL

ECHO 'Creating artificat'
7z a ../%FILE_NAME%.zip .

:: Cleanup
cd ..
RMDIR /S /Q %PACKAGE_NAME%
DEL /Q temp.zip

ECHO 'Done'

cd ../..
