@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo ========================================
echo    BUILD + VERSION - CLIENTE JIMMY
echo ========================================
echo.

REM 0) Checks basicos
for %%X in (git node npm powershell) do (
  where %%X >nul 2>nul || (echo ERRO: %%X nao encontrado no PATH. & pause & exit /b 1)
)

REM 1) Data/Hora sem WMIC (usa PowerShell)
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"`) do set datestamp=%%i
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format HHmmss"`) do set timestmp=%%i
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format dd/MM/yyyy HH:mm:ss"`) do set humanDate=%%i

echo Data/Hora: %humanDate%
echo Ambiente: Windows (Local)
echo.

REM 2) Estrutura do projeto
if not exist "backend" (
  echo ERRO: Execute este script na pasta raiz do projeto (precisa de 'backend' e 'frontend').
  pause & exit /b 1
)
if not exist ".git" (
  echo ERRO: Repositorio Git nao inicializado. Rode: git init
  pause & exit /b 1
)

REM 3) Versao atual (leitura segura via PowerShell/JSON)
for /f "usebackq tokens=*" %%i in (`
  powershell -NoProfile -Command ^
    "(Get-Content 'backend/package.json' -Raw | ConvertFrom-Json).version"
`) do set current_version=%%i

if "%current_version%"=="" (
  echo ERRO: Nao foi possivel ler a versao do backend\package.json
  pause & exit /b 1
)

echo Versao atual: %current_version%
echo.

REM 4) Status do Git
set git_dirty=0
for /f "usebackq tokens=*" %%i in (`git status --porcelain`) do set git_dirty=1

if "%git_dirty%"=="0" (
  echo Repo limpo - sem alteracoes pendentes.
) else (
  echo Ha alteracoes nao commitadas:
  git status --short
  echo.
  set /p "commit_choice=Deseja fazer commit das alteracoes? (s/n): "
  if /i "%commit_choice%"=="s" (
    set /p "commit_msg=Mensagem do commit: "
    git add .
    git commit -m "%commit_msg%"
    echo Commit realizado.
  ) else (
    echo Continuando com alteracoes nao commitadas...
  )
)
echo.

REM 5) Tipo de build
echo TIPO DE BUILD:
echo 1. Patch   -> %current_version% -> +0.0.1
echo 2. Minor   -> %current_version% -> +0.1.0
echo 3. Major   -> %current_version% -> +1.0.0
echo 4. Somente build (nao muda versao)
echo.
set /p "version_type=Escolha (1-4): "

if "%version_type%"=="1" (set "version_increment=patch" & set "commit_prefix=fix")
if "%version_type%"=="2" (set "version_increment=minor" & set "commit_prefix=feat")
if "%version_type%"=="3" (set "version_increment=major" & set "commit_prefix=feat!")
if "%version_type%"=="4" (set "version_increment=none"  & set "commit_prefix=build")

if not defined version_increment (
  echo ERRO: Opcao invalida.
  pause & exit /b 1
)

REM 6) BUILD BACKEND
echo BUILD BACKEND (TypeScript -> JavaScript)
pushd backend

if exist package-lock.json (
  echo Instalando dependencias (npm ci)...
  call npm ci
) else (
  echo Instalando dependencias (npm install)...
  call npm install
)
if %errorlevel% neq 0 (echo ERRO ao instalar deps do backend & popd & pause & exit /b 1)

echo Compilando TypeScript...
call npm run build
if %errorlevel% neq 0 (echo ERRO ao buildar backend & popd & pause & exit /b 1)
echo Backend OK.
popd
echo.

REM 7) BUILD FRONTEND
echo BUILD FRONTEND (React -> Static Files)
pushd frontend

if exist package-lock.json (
  echo Instalando dependencias (npm ci)...
  call npm ci
) else (
  echo Instalando dependencias (npm install --legacy-peer-deps)...
  call npm install --legacy-peer-deps
)
if %errorlevel% neq 0 (echo ERRO ao instalar deps do frontend & popd & pause & exit /b 1)

set NODE_OPTIONS=--openssl-legacy-provider
echo Buildando React...
call npx react-scripts build
set NODE_OPTIONS=
if %errorlevel% neq 0 (echo ERRO ao buildar frontend & popd & pause & exit /b 1)
echo Frontend OK.
popd
echo.

REM 8) Bump de versao (se aplicavel)
set "new_version=%current_version%"

if /i not "%version_increment%"=="none" (
  echo Atualizando versao...

  pushd backend
  call npm version %version_increment% --no-git-tag-version
  popd

  pushd frontend
  call npm version %version_increment% --no-git-tag-version
  popd

  for /f "usebackq tokens=*" %%i in (`
    powershell -NoProfile -Command ^
      "(Get-Content 'backend/package.json' -Raw | ConvertFrom-Json).version"
  `) do set new_version=%%i

  echo Versao: %current_version% -> %new_version%

  set "tag_name=v%new_version%+local.%datestamp%%timestmp%"

  git add .
  git commit -m "%commit_prefix%: build v%new_version% - %datestamp% %timestmp%"
  git tag -a "%tag_name%" -m "Build local %new_version% (%datestamp% %timestmp%)"
  echo Tag criada: %tag_name%
) else (
  echo Versao mantida: %current_version%
)

REM 9) Resumo
echo.
echo ========================================
echo BUILD FINALIZADO
echo ========================================
echo Saidas:
echo   - backend\dist\
echo   - frontend\build\
echo.
echo Versao atual: %new_version%
if /i not "%version_increment%"=="none" echo Tag local: %tag_name%
echo.
echo Proximos passos:
echo   1) Testar localmente
echo   2) git push origin main --tags
echo   3) Atualizar CHANGELOG.md
echo.
pause
