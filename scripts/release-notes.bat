@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    GERADOR DE RELEASE NOTES
echo ========================================
echo.

REM Verificar se Git está disponível
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Git não encontrado
    pause
    exit /b 1
)

REM Obter última tag
for /f "tokens=*" %%a in ('git describe --tags --abbrev=0 2^>nul') do set "last_tag=%%a"
if "!last_tag!"=="" (
    echo ⚠️ Nenhuma tag encontrada. Usando todos os commits.
    set "commit_range=HEAD"
) else (
    echo 📋 Última tag: !last_tag!
    set "commit_range=!last_tag!..HEAD"
)

REM Obter data atual
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "date_formatted=%DD%/%MM%/%YYYY%"

echo.
echo 📝 Gerando release notes para: !commit_range!
echo.

REM Criar arquivo temporário
set "temp_file=temp_release_notes.txt"
echo ## Release Notes - %date_formatted% > !temp_file!
echo. >> !temp_file!

REM Buscar commits por tipo
echo ### 🚀 Novas Funcionalidades >> !temp_file!
git log !commit_range! --oneline --grep="^feat" --pretty=format:"- %%s" >> !temp_file! 2>nul
echo. >> !temp_file!
echo. >> !temp_file!

echo ### 🐛 Correções >> !temp_file!
git log !commit_range! --oneline --grep="^fix" --pretty=format:"- %%s" >> !temp_file! 2>nul
echo. >> !temp_file!
echo. >> !temp_file!

echo ### 🔧 Melhorias >> !temp_file!
git log !commit_range! --oneline --grep="^refactor\|^perf\|^improve" --pretty=format:"- %%s" >> !temp_file! 2>nul
echo. >> !temp_file!
echo. >> !temp_file!

echo ### 📚 Documentação >> !temp_file!
git log !commit_range! --oneline --grep="^docs" --pretty=format:"- %%s" >> !temp_file! 2>nul
echo. >> !temp_file!
echo. >> !temp_file!

echo ### 🔨 Manutenção >> !temp_file!
git log !commit_range! --oneline --grep="^chore\|^build" --pretty=format:"- %%s" >> !temp_file! 2>nul
echo. >> !temp_file!

REM Mostrar resultado
echo ✅ Release notes geradas:
echo.
type !temp_file!
echo.

set /p "save_choice=Salvar em RELEASE_NOTES.md? (s/n): "
if /i "!save_choice!"=="s" (
    copy !temp_file! RELEASE_NOTES.md >nul
    echo ✅ Salvo em RELEASE_NOTES.md
) else (
    echo ℹ️ Release notes não salvas
)

del !temp_file!
echo.
pause
