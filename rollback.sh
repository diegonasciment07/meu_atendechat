#!/bin/bash
echo "🔄 ROLLBACK DEL BRANDING"
echo "========================"

# Restaurar backup
if [ -d "backup-20250910-091559" ]; then
    echo "Restaurando desde backup: backup-20250910-091559"
    
    if [ -d "backup-20250910-091559/css" ]; then
        rm -rf css
        cp -r "backup-20250910-091559/css" .
        echo "CSS restaurado"
    fi
    
    if [ -d "backup-20250910-091559/assets" ]; then
        rm -rf assets
        cp -r "backup-20250910-091559/assets" .
        echo "Assets restaurados"
    fi
    
    if [ -d "backup-20250910-091559/styles" ]; then
        rm -rf styles
        cp -r "backup-20250910-091559/styles" .
        echo "Styles restaurados"
    fi
    
    echo "✅ Rollback completado"
else
    echo "❌ Backup no encontrado: backup-20250910-091559"
fi
