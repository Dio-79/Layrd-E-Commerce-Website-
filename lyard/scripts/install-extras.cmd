@echo off
rem Installs what the site and the Firebase setup need on top of package.json,
rem WITHOUT changing package.json or package-lock.json (--no-save):
rem   formik, yup, react-hook-form  - the login/sign-up/checkout forms import these
rem   firebase-admin                - the new API routes talk to Firebase
rem   firebase-tools, tsx, vitest, vite - emulators, scripts and tests
rem Note: a plain "npm install" or "npm ci" removes them again; the start
rem script runs this file whenever they are missing.
cd /d "%~dp0.."
if not exist node_modules\next call npm ci
call npm install --no-save --legacy-peer-deps formik@2.4.9 yup@1.7.1 react-hook-form@7.89.0 firebase-admin@14.5.0 firebase-tools@15.34.1 tsx@4.23.15 vitest@5.0.5 vite@8.3.5
