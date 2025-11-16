/**
 * Configuration file for the Convex Hull Visualizer
 * Update these values for your deployment
 */

const CONFIG = {
    // API Configuration
    API_URL: 'https://visualizechan-production.up.railway.app',
    
    // For local development, uncomment this line:
    // API_URL: 'http://localhost:5001',
    
    // Application Settings
    DEFAULT_POINT_COUNT: 20,
    DEFAULT_ALGORITHM: 'graham',
    DEFAULT_ANIMATION_SPEED: 1000, // milliseconds
    
    // Visualization Settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    POINT_RADIUS: 6,
    
    // Performance Settings
    MAX_POINTS: 1000,
    ANIMATION_SPEED_MIN: 100,
    ANIMATION_SPEED_MAX: 3000
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
