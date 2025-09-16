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
