/**
 * Configuração Global de Debug
 * Save this as: GUI/3d-viewer/js/debug-config.js
 */

// Sistema central de controlo de debugging
window.DEBUG_CONFIG = {
    // Controlo geral - desliga TUDO se for false
    ENABLED: true,
    
    // Controlos específicos por sistema
    UNITS_SYSTEM: false,      // Conversões e cálculos de unidades
    VOLUME_EFFICIENCY: false, // Cálculos de eficiência volumétrica  
    CENTER_OF_MASS: false,    // Cálculos de centro de massa
    HEIGHT_CALC: false,       // Cálculos de altura
    ANIMATION: false,        // Logs de animação (muito spam)
    REVERSE_ENGINEERING: true,
    INITIALIZATION: false,   // Logs de inicialização (só uma vez)
    PROGRESS: false          // Logs repetitivos de progresso
};

// Função helper para logging condicional
window.debugLog = function(category, ...args) {
    if (window.DEBUG_CONFIG.ENABLED && window.DEBUG_CONFIG[category]) {
        console.log(`[${category}]`, ...args);
    }
};

// Função helper para warnings (sempre ativas)
window.debugWarn = function(category, ...args) {
    if (window.DEBUG_CONFIG.ENABLED) {
        console.warn(`[${category}]`, ...args);
    }
};

// Função helper para errors (sempre ativas)
window.debugError = function(category, ...args) {
    console.error(`[${category}]`, ...args);
};