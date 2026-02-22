// ========================================
// Authentication Module
// ========================================

const Auth = {
    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Get current user from localStorage
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Check if user is admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Logout
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    },

    // Get current user from API
    async getCurrentUser() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get user');
            }

            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Update UI with user info
    updateUI() {
        const user = this.getUser();
        if (user) {
            const userNameElements = document.querySelectorAll('.user-name');
            const userRoleElements = document.querySelectorAll('.user-role');
            
            userNameElements.forEach(el => el.textContent = user.fullName);
            userRoleElements.forEach(el => el.textContent = user.role);
        }
    },

    // Protect page - redirect to login if not authenticated
    protectPage() {
        if (!this.isAuthenticated()) {
            window.location.href = '../index.html';
            return false;
        }
        return true;
    },

    // Make authenticated API request
    async apiRequest(url, options = {}) {
        const token = this.getToken();
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        };

        const response = await fetch(`${CONFIG.API_URL}${url}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            // Token expired or invalid
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update UI with user info
    Auth.updateUI();

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.logout());
    }
});

// API helper that matches the pattern used in pages
Auth.api = async function(url, options = {}) {
    const token = this.getToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Auth };
}
