@echo off
rem Starts the Layrd site on this PC, connected to your Firebase project
rem (settings in .env.local).  Site: http://localhost:3000
cd /d "%~dp0"
if not exist node_modules\firebase-admin call scripts\install-extras.cmd
if not exist node_modules\formik call scripts\install-extras.cmd
call npx next dev
pause
