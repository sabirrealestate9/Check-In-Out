// ========================================
// Configuration - Update this with your API URL
// ========================================

const CONFIG = {
    // Change this to your backend API URL
    // For local development: 'http://localhost:5000/api'
    // For production: 'https://your-api-domain.com/api'
    API_URL: 'http://localhost:5000/api',
    
    // App info
    APP_NAME: 'Sabir Amin Real Estate',
    VERSION: '1.0.0'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
