/**
 * Central Icon Library System - Feather Icons Integration
 * 
 * Standard Library for the SVG images used in the GUI
 */

class IconLibrary {
    constructor() {
        // Base configuration for all icons
        this.defaultConfig = {
            width: '16',
            height: '16',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
        };
        
        // Icon definitions using Feather Icons SVG paths
        this.icons = {
            // Animation controls
            play: `<path d="m9 18 6-6-6-6v12z"/>`,
            pause: `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`,
            stop: `<rect x="6" y="6" width="12" height="12" rx="2"/>`,
            
            // Navigation controls  
            skipBack: `<polygon points="19,20 9,12 19,4 19,20"/><line x1="5" y1="19" x2="5" y2="5"/>`,
            skipForward: `<polygon points="5,4 15,12 5,20 5,4"/><line x1="19" y1="5" x2="19" y2="19"/>`,
            stepBack: `<polyline points="15,18 9,12 15,6"/>`,
            stepForward: `<polyline points="9,18 15,12 9,6"/>`,
            
            // Pallet controls
            restart: `<polyline points="1,4 1,10 7,10"/><path d="M3.51,15a9,9,0,0,0,13.65,0,9,9,0,0,0-9.65-7.71"/>`,
            refresh: `<polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M20.49,9a9,9,0,0,0-11.24-8.53,9,9,0,0,0-7.74,9"/>`,
            
            // Box controls
            plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
            minus: `<line x1="5" y1="12" x2="19" y2="12"/>`,
            box: `<path d="M12.89,3.1A1.44,1.44,0,0,0,12,2.78a1.44,1.44,0,0,0-.89.32L8.5,4.82a1.44,1.44,0,0,0-.61,1.18V18a1.44,1.44,0,0,0,.61,1.18l2.61,1.72a1.44,1.44,0,0,0,1.78,0l2.61-1.72A1.44,1.44,0,0,0,15.5,18V6A1.44,1.44,0,0,0,14.89,4.82Z"/><polyline points="7.9,4.8 12,7.2 16.1,4.8"/><line x1="12" y1="22" x2="12" y2="7.2"/>`,
            
            // Status indicators
            check: `<polyline points="20,6 9,17 4,12"/>`,
            checkCircle: `<path d="M22,11.08V12a10,10,0,1,1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>`,
            
            // General purpose
            settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4,15a1.65,1.65,0,0,0,.33,1.82l.06.06a2,2,0,0,1,0,2.83,2,2,0,0,1-2.83,0l-.06-.06a1.65,1.65,0,0,0-1.82-.33,1.65,1.65,0,0,0-1,1.51V21a2,2,0,0,1-2,2,2,2,0,0,1-2-2v-.09A1.65,1.65,0,0,0,9,19.4a1.65,1.65,0,0,0-1.82.33l-.06.06a2,2,0,0,1-2.83,0,2,2,0,0,1,0-2.83l.06-.06a1.65,1.65,0,0,0,.33-1.82,1.65,1.65,0,0,0-1.51-1H3a2,2,0,0,1-2-2,2,2,0,0,1,2-2h.09A1.65,1.65,0,0,0,4.6,9a1.65,1.65,0,0,0-.33-1.82L4.21,7.11a2,2,0,0,1,0-2.83,2,2,0,0,1,2.83,0L7.11,4.34A1.65,1.65,0,0,0,9,4.67a1.65,1.65,0,0,0,1,1.51V6.09A2,2,0,0,1,12,4.09a2,2,0,0,1,2,2v.09a1.65,1.65,0,0,0,1,1.51,1.65,1.65,0,0,0,1.82-.33l.06-.06a2,2,0,0,1,2.83,0,2,2,0,0,1,0,2.83l-.06.06a1.65,1.65,0,0,0-.33,1.82,1.65,1.65,0,0,0,1.51,1H21a2,2,0,0,1,2,2,2,2,0,0,1-2,2h-.09A1.65,1.65,0,0,0,19.4,15Z"/>`,
            info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
            
            // File operations
            upload: `<path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V15"/><polyline points="7,10 12,5 17,10"/><line x1="12" y1="5" x2="12" y2="15"/>`,
            download: `<path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V15"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
            
            // Zoom and view controls
            zoomIn: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>`,
            zoomOut: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/>`,
            maximize: `<path d="M8,3H5A2,2,0,0,0,3,5V8"/><path d="M21,8V5a2,2,0,0,0-2-2H16"/><path d="M16,21h3a2,2,0,0,0,2-2V16"/><path d="M8,21H5a2,2,0,0,0-2-2V16"/>`,
            
            // Arrows for better navigation
            arrowLeft: `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>`,
            arrowRight: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>`,
            arrowUp: `<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/>`,
            arrowDown: `<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/>`
        };
        
        console.log('IconLibrary initialized with', Object.keys(this.icons).length, 'icons');
    }
    
    /**
     * Create an SVG icon element
     * @param {string} iconName - Name of the icon from our library
     * @param {Object} options - Custom options for size, color, etc.
     * @returns {string} - Complete SVG string ready for innerHTML
     */
    createIcon(iconName, options = {}) {
        // Check if icon exists
        if (!this.icons[iconName]) {
            console.warn(`Icon '${iconName}' not found in library. Available icons:`, Object.keys(this.icons));
            return this.createIcon('box'); // Fallback to box icon
        }
        
        // Merge default config with custom options
        const config = { ...this.defaultConfig, ...options };
        
        // Build SVG attributes string
        const attributes = Object.entries(config)
            .map(([key, value]) => `${this.camelToKebab(key)}="${value}"`)
            .join(' ');
        
        // Create complete SVG
        const svg = `
            <svg ${attributes} viewBox="0 0 24 24" class="feather-icon feather-${iconName}">
                ${this.icons[iconName]}
            </svg>
        `;
        
        return svg.trim();
    }
    
    /**
     * Create an icon specifically sized for buttons
     * @param {string} iconName - Name of the icon
     * @param {string} size - 'small', 'medium', or 'large'
     * @returns {string} - SVG string optimized for buttons
     */
    createButtonIcon(iconName, size = 'medium') {
        const sizeMap = {
            small: { width: '14', height: '14', strokeWidth: '2' },
            medium: { width: '16', height: '16', strokeWidth: '2' },
            large: { width: '18', height: '18', strokeWidth: '1.5' }
        };
        
        const sizeConfig = sizeMap[size] || sizeMap.medium;
        
        return this.createIcon(iconName, {
            ...sizeConfig,
            stroke: 'currentColor' // This allows CSS color inheritance
        });
    }
    
    /**
     * Utility method to convert camelCase to kebab-case for SVG attributes
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    /**
     * Get list of all available icons
     * @returns {Array} - Array of icon names
     */
    getAvailableIcons() {
        return Object.keys(this.icons);
    }
    
    /**
     * Add a custom icon to the library
     * @param {string} name - Icon name
     * @param {string} svgPath - SVG path data
     */
    addCustomIcon(name, svgPath) {
        this.icons[name] = svgPath;
        console.log(`Custom icon '${name}' added to library`);
    }
}

// Create global instance
window.iconLibrary = new IconLibrary();

/**
 * Convenience function for quick icon creation
 * @param {string} iconName - Name of the icon
 * @param {Object} options - Icon options
 * @returns {string} - SVG string
 */
window.createIcon = function(iconName, options = {}) {
    return window.iconLibrary.createIcon(iconName, options);
};

/**
 * Convenience function for button icons
 * @param {string} iconName - Name of the icon
 * @param {string} size - Size variant
 * @returns {string} - SVG string
 */
window.createButtonIcon = function(iconName, size = 'medium') {
    return window.iconLibrary.createButtonIcon(iconName, size);
};

console.log('✓ Icon Library loaded successfully');