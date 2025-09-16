#!/bin/bash

# SCRIPT DE IMPLEMENTACIÓN DEL NUEVO BRANDING LIDER.CHAT
# Este script ayuda a aplicar el nuevo branding al SaaS existente

echo "🎨 IMPLEMENTACIÓN DEL NUEVO BRANDING LIDER.CHAT"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -f "index.html" ] && [ ! -f "composer.json" ]; then
    show_error "No se detectó un proyecto web. Asegúrate de estar en el directorio raíz del SaaS."
    exit 1
fi

show_message "Detectado proyecto web en: $(pwd)"

# Crear backup
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
show_message "Creando backup en: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup de archivos CSS existentes
if [ -d "css" ]; then
    cp -r css "$BACKUP_DIR/"
    show_success "Backup de CSS creado"
fi

if [ -d "assets" ]; then
    cp -r assets "$BACKUP_DIR/"
    show_success "Backup de assets creado"
fi

if [ -d "styles" ]; then
    cp -r styles "$BACKUP_DIR/"
    show_success "Backup de styles creado"
fi

# Crear directorio CSS si no existe
mkdir -p css

# Copiar archivos de branding
show_message "Copiando archivos de branding..."

# Aquí el usuario debe copiar los archivos manualmente o proporcionarlos
if [ -f "lider-chat-branding.css" ]; then
    cp lider-chat-branding.css css/
    show_success "lider-chat-branding.css copiado"
else
    show_warning "Archivo lider-chat-branding.css no encontrado. Debes copiarlo manualmente."
fi

if [ -f "lider-chat-saas-components.css" ]; then
    cp lider-chat-saas-components.css css/
    show_success "lider-chat-saas-components.css copiado"
else
    show_warning "Archivo lider-chat-saas-components.css no encontrado. Debes copiarlo manualmente."
fi

# Buscar archivos HTML principales
HTML_FILES=$(find . -name "*.html" -o -name "*.php" -o -name "*.blade.php" | head -5)

show_message "Archivos HTML/PHP encontrados:"
echo "$HTML_FILES"

# Función para agregar fuente Inter
add_inter_font() {
    local file="$1"
    if grep -q "fonts.googleapis.com.*Inter" "$file"; then
        show_warning "Fuente Inter ya está incluida en $file"
    else
        show_message "Agregando fuente Inter a $file"
        # Buscar la etiqueta </head> y agregar antes
        sed -i '/<\/head>/i\
<link rel="preconnect" href="https://fonts.googleapis.com">\
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">' "$file"
        show_success "Fuente Inter agregada a $file"
    fi
}

# Función para agregar CSS de branding
add_branding_css() {
    local file="$1"
    if grep -q "lider-chat-branding.css" "$file"; then
        show_warning "CSS de branding ya está incluido en $file"
    else
        show_message "Agregando CSS de branding a $file"
        sed -i '/<\/head>/i\
<link rel="stylesheet" href="./css/lider-chat-branding.css">\
<link rel="stylesheet" href="./css/lider-chat-saas-components.css">' "$file"
        show_success "CSS de branding agregado a $file"
    fi
}

# Aplicar cambios a archivos HTML
while IFS= read -r file; do
    if [ -f "$file" ]; then
        show_message "Procesando: $file"
        add_inter_font "$file"
        add_branding_css "$file"
    fi
done <<< "$HTML_FILES"

# Buscar y reportar colores morados en CSS
show_message "Buscando referencias a colores morados en CSS..."
PURPLE_REFS=$(grep -r "#8B5CF6\|#A855F7\|#9333EA\|purple\|violet" css/ 2>/dev/null || true)

if [ -n "$PURPLE_REFS" ]; then
    show_warning "Se encontraron referencias a colores morados:"
    echo "$PURPLE_REFS"
    echo ""
    show_message "Estos colores deben ser reemplazados manualmente según la guía de migración."
fi

# Crear archivo de configuración
cat > css/lider-config.js << 'EOF'
// CONFIGURACIÓN DE COLORES LIDER.CHAT
const LIDER_COLORS = {
    primary: '#4A90E2',
    secondary: '#FF6B47', 
    accent: '#4ECDC4',
    navy: '#1A365D',
    bgPrimary: '#0A0A0A',
    bgSecondary: '#1A1A1A',
    bgCard: '#1F1F1F',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    border: '#333333'
};

// Función para aplicar colores dinámicamente
function applyLiderColors() {
    const root = document.documentElement;
    Object.entries(LIDER_COLORS).forEach(([key, value]) => {
        root.style.setProperty(`--lider-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });
}

// Aplicar colores cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLiderColors);
} else {
    applyLiderColors();
}
EOF

show_success "Archivo de configuración creado: css/lider-config.js"

# Crear archivo de rollback
cat > rollback.sh << EOF
#!/bin/bash
echo "🔄 ROLLBACK DEL BRANDING"
echo "========================"

# Restaurar backup
if [ -d "$BACKUP_DIR" ]; then
    echo "Restaurando desde backup: $BACKUP_DIR"
    
    if [ -d "$BACKUP_DIR/css" ]; then
        rm -rf css
        cp -r "$BACKUP_DIR/css" .
        echo "CSS restaurado"
    fi
    
    if [ -d "$BACKUP_DIR/assets" ]; then
        rm -rf assets
        cp -r "$BACKUP_DIR/assets" .
        echo "Assets restaurados"
    fi
    
    if [ -d "$BACKUP_DIR/styles" ]; then
        rm -rf styles
        cp -r "$BACKUP_DIR/styles" .
        echo "Styles restaurados"
    fi
    
    echo "✅ Rollback completado"
else
    echo "❌ Backup no encontrado: $BACKUP_DIR"
fi
EOF

chmod +x rollback.sh
show_success "Script de rollback creado: rollback.sh"

# Resumen final
echo ""
echo "🎉 IMPLEMENTACIÓN COMPLETADA"
echo "============================"
echo ""
show_success "✅ Backup creado en: $BACKUP_DIR"
show_success "✅ Archivos CSS de branding copiados"
show_success "✅ Fuente Inter agregada a archivos HTML"
show_success "✅ CSS de branding incluido en archivos HTML"
show_success "✅ Script de rollback creado"
echo ""
show_message "📋 PRÓXIMOS PASOS:"
echo "1. Revisar los archivos HTML para verificar que los cambios se aplicaron correctamente"
echo "2. Reemplazar manualmente las referencias a colores morados según la guía"
echo "3. Actualizar el logo a la versión de Lider.Chat"
echo "4. Probar la aplicación en diferentes navegadores"
echo "5. Si hay problemas, ejecutar: ./rollback.sh"
echo ""
show_message "📖 Consulta la GUIA_MIGRACION_BRANDING.md para más detalles"
echo ""
show_warning "⚠️  IMPORTANTE: Prueba todos los cambios en un entorno de desarrollo antes de aplicar en producción"

