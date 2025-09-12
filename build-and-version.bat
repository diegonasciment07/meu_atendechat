@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    BUILD + VERSION - ATENDECHAT
echo ========================================
echo.

REM Obter data/hora atual
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%%MM%%DD%"
set "timestamp=%HH%:%Min%:%Sec%"

echo 📅 Data/Hora: %DD%/%MM%/%YYYY% %timestamp%
echo 🖥️ Ambiente: Windows (Local)
echo.

REM Verificar se estamos na pasta correta
if not exist "backend" (
    echo ❌ ERRO: Execute este script na pasta raiz do projeto
    echo    Deve conter as pastas 'backend' e 'frontend'
    pause
    exit /b 1
)

REM Verificar se Git está inicializado
if not exist ".git" (
    echo ❌ ERRO: Repositório Git não inicializado
    echo    Execute: git init
    pause
    exit /b 1
)

echo 🔍 INFORMAÇÕES DA VERSÃO ATUAL:
echo.

REM Ler versão atual do package.json do backend
for /f "tokens=2 delims=:" %%a in ('findstr "version" backend\package.json') do (
    set "current_version=%%a"
    set "current_version=!current_version: =!"
    set "current_version=!current_version:"=!"
    set "current_version=!current_version:,=!"
)

echo 📦 Versão atual: !current_version!

REM Verificar status do Git
echo 🔄 Status do repositório:
git status --porcelain > temp_status.txt
set /p git_status=<temp_status.txt
del temp_status.txt

if "!git_status!"=="" (
    echo   ✅ Repositório limpo - sem alterações pendentes
) else (
    echo   ⚠️ Existem alterações não commitadas
    echo.
    echo 📝 ALTERAÇÕES PENDENTES:
    git status --short
    echo.
    set /p "commit_choice=Deseja fazer commit das alterações? (s/n): "
    if /i "!commit_choice!"=="s" (
        set /p "commit_msg=Digite a mensagem do commit: "
        git add .
        git commit -m "!commit_msg!"
        echo   ✅ Commit realizado com sucesso!
    ) else (
        echo   ⚠️ Continuando com alterações não commitadas...
    )
)
echo.

echo 🎯 TIPO DE BUILD:
echo 1. Patch (correção de bug) - v!current_version! → v!current_version!+0.0.1
echo 2. Minor (nova funcionalidade) - v!current_version! → v!current_version!+0.1.0  
echo 3. Major (breaking change) - v!current_version! → v!current_version!+1.0.0
echo 4. Build apenas (sem alterar versão)
echo.
set /p "version_type=Escolha o tipo (1-4): "

REM Calcular nova versão
if "!version_type!"=="1" (
    set "version_increment=patch"
    set "commit_prefix=fix"
) else if "!version_type!"=="2" (
    set "version_increment=minor"
    set "commit_prefix=feat"
) else if "!version_type!"=="3" (
    set "version_increment=major"
    set "commit_prefix=feat!"
) else (
    set "version_increment=none"
    set "commit_prefix=build"
)

echo.
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

REM Atualizar versão se necessário
if not "!version_increment!"=="none" (
    echo 🏷️ ATUALIZANDO VERSÃO...
    
    REM Atualizar versão no backend
    cd backend
    call npm version !version_increment! --no-git-tag-version
    cd ..
    
    REM Atualizar versão no frontend
    cd frontend
    call npm version !version_increment! --no-git-tag-version
    cd ..
    
    REM Ler nova versão
    for /f "tokens=2 delims=:" %%a in ('findstr "version" backend\package.json') do (
        set "new_version=%%a"
        set "new_version=!new_version: =!"
        set "new_version=!new_version:"=!"
        set "new_version=!new_version:,=!"
    )
    
    echo   ✅ Versão atualizada: !current_version! → !new_version!
    
    REM Criar tag com timestamp
    set "tag_name=v!new_version!-local.!datestamp!"
    
    echo   🏷️ Criando tag: !tag_name!
    git add .
    git commit -m "!commit_prefix!: build v!new_version! - !datestamp!"
    git tag !tag_name!
    
    echo   ✅ Tag criada com sucesso!
) else (
    echo 🏷️ Versão mantida: !current_version!
)

echo.
echo ========================================
echo ✅ BUILD + VERSION CONCLUÍDO COM SUCESSO!
echo ========================================
echo.
echo 📁 Arquivos gerados:
echo   - backend/dist/     (JavaScript compilado)
echo   - frontend/build/   (Arquivos estáticos)
echo.
if not "!version_increment!"=="none" (
    echo 🏷️ Nova versão: !new_version!
    echo 📅 Tag criada: !tag_name!
    echo.
)
echo 🚀 PRÓXIMOS PASSOS:
echo 1. Testar localmente se necessário
echo 2. Fazer push: git push origin main --tags
echo 3. Fazer deploy para servidor
echo 4. Documentar no CHANGELOG.md
echo.

echo Pressione qualquer tecla para continuar...
pause >nul
