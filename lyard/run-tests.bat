@echo off
rem 1) The automated tests: run against throwaway Firebase emulators (never your real data).
rem 2) The live check: runs against your real Firebase project through the running site,
rem    so start-layrd.bat must be running first. It cleans up its test account and order.
cd /d "%~dp0"
if not exist node_modules\vitest call scripts\install-extras.cmd
echo.
echo === Automated tests (emulators) ===
call node scripts\test-with-emulators.mjs
echo.
echo === Live check (real Firebase project) ===
call npx tsx --env-file=.env.local scripts\smoke-real.mts
pause
