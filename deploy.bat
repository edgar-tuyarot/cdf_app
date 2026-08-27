@echo off
setlocal

echo ==========================================
echo       DEPLOY CDF BACKEND
echo ==========================================
echo.

echo [1/3] Copiando archivos al servidor...
scp -P 2222 -r C:\cdf-app\back\* debian@127.0.0.1:/opt/cdf-backend/

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la copia de archivos.
    pause
    exit /b 1
)

echo.
echo [2/3] Reiniciando CDF Backend...
ssh -p 2222 debian@127.0.0.1 "sudo systemctl restart cdf-backend.service"

if errorlevel 1 (
    echo.
    echo ERROR: Fallo al reiniciar CDF Backend.
    pause
    exit /b 1
)

echo.
echo [3/3] Recargando Nginx...
ssh -p 2222 debian@127.0.0.1 "sudo systemctl reload nginx"

if errorlevel 1 (
    echo.
    echo ERROR: Fallo al recargar Nginx.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo       DEPLOY COMPLETADO CORRECTAMENTE
echo ==========================================
echo.

pause