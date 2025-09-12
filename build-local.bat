@echo off
echo ========================================
echo    BUILD LOCAL - ATENDECHAT
echo ========================================
echo.

echo 📅 Data/Hora: %date% %time%
echo 🖥️ Ambiente: Windows (Local)
echo.

REM Verificar se estamos na pasta correta
if not exist "backend" (
    echo ❌ ERRO: Execute este script na pasta raiz do projeto
    echo    Deve conter as pastas 'backend' e 'frontend'
    pause
    exit /b 1
)

echo 🔄 Iniciando build local...
echo.

REM Build Backend
echo 📦 BUILD BACKEND (TypeScript → JavaScript)
cd backend
echo   - Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

echo   - Compilando TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro ao buildar backend
    pause
    exit /b 1
)
echo   ✅ Backend buildado com sucesso!
echo.

REM Build Frontend
echo 📦 BUILD FRONTEND (React → Static Files)
cd ..\frontend
echo   - Instalando dependências (com --legacy-peer-deps)...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

echo   - Buildando React (com OpenSSL legacy)...
call npx --node-options="--openssl-legacy-provider" react-scripts build
if %errorlevel% neq 0 (
    echo ❌ Erro ao buildar frontend
    pause
    exit /b 1
)
echo   ✅ Frontend buildado com sucesso!
echo.

cd ..

echo ========================================
echo ✅ BUILD LOCAL CONCLUÍDO COM SUCESSO!
echo ========================================
echo.
echo 📁 Arquivos gerados:
echo   - backend/dist/     (JavaScript compilado)
echo   - frontend/build/   (Arquivos estáticos)
echo.
echo 🚀 PRÓXIMOS PASSOS:
echo 1. Testar localmente se necessário
echo 2. Fazer deploy para servidor
echo 3. Documentar no HISTORICO.md
echo.

echo Pressione qualquer tecla para continuar...
pause >nul
