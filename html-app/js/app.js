// ========================================
// Main App Module - Utilities & API Functions
// ========================================

const App = {
    // Show toast notification
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer') || (() => {
            const div = document.createElement('div');
            div.id = 'toastContainer';
            div.className = 'toast-container';
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        toast.innerHTML = `
            <span style="font-weight: bold;">${icon}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format file size
    formatFileSize(bytes) {
        if (!bytes) return 'N/A';
        const size = parseInt(bytes);
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    },

    // Show loading state on button
    setLoading(button, loading) {
        const textSpan = button.querySelector('.btn-text');
        const loadingSpan = button.querySelector('.btn-loading');
        
        if (loading) {
            button.disabled = true;
            if (textSpan) textSpan.classList.add('hidden');
            if (loadingSpan) loadingSpan.classList.remove('hidden');
        } else {
            button.disabled = false;
            if (textSpan) textSpan.classList.remove('hidden');
            if (loadingSpan) loadingSpan.classList.add('hidden');
        }
    },

    // Toggle mobile sidebar
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    },

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Get status badge HTML
    getStatusBadge(status) {
        const badges = {
            active: '<span class="badge badge-success">● Active</span>',
            checked_out: '<span class="badge badge-gray">● Checked Out</span>',
            cancelled: '<span class="badge badge-red">● Cancelled</span>'
        };
        return badges[status] || status;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Alias for toast (used in pages)
    showToast(message, type = 'info', duration = 3000) {
        this.toast(message, type, duration);
    }
};

// ========================================
// API Functions
// ========================================

const API = {
    // Dashboard
    dashboard: {
        async getStats() {
            return await Auth.apiRequest('/dashboard/stats');
        },
        async getActivity(limit = 20) {
            return await Auth.apiRequest(`/dashboard/activity?limit=${limit}`);
        }
    },

    // Tenants
    tenants: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await Auth.apiRequest(`/tenants?${queryString}`);
        },
        async getById(id) {
            return await Auth.apiRequest(`/tenants/${id}`);
        },
        async create(data) {
            return await Auth.apiRequest('/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async update(id, data) {
            return await Auth.apiRequest(`/tenants/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async checkout(id) {
            return await Auth.apiRequest(`/tenants/${id}/checkout`, {
                method: 'POST'
            });
        },
        async delete(id) {
            return await Auth.apiRequest(`/tenants/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Studios
    studios: {
        async getAll() {
            return await Auth.apiRequest('/studios');
        },
        async getById(id) {
            return await Auth.apiRequest(`/studios/${id}`);
        },
        async create(data) {
            return await Auth.apiRequest('/studios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async update(id, data) {
            return await Auth.apiRequest(`/studios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async delete(id) {
            return await Auth.apiRequest(`/studios/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Checklists
    checklists: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await Auth.apiRequest(`/checklists?${queryString}`);
        },
        async getById(id) {
            return await Auth.apiRequest(`/checklists/${id}`);
        },
        async create(formData) {
            return await Auth.apiRequest('/checklists', {
                method: 'POST',
                body: formData
            });
        },
        async update(id, data) {
            return await Auth.apiRequest(`/checklists/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async delete(id) {
            return await Auth.apiRequest(`/checklists/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Google Drive
    drive: {
        async getStatus() {
            return await Auth.apiRequest('/drive/status');
        },
        async getStudios() {
            return await Auth.apiRequest('/drive/studios');
        },
        async getContents(folderId) {
            return await Auth.apiRequest(`/drive/studios/${folderId}/contents`);
        },
        async syncStudios() {
            return await Auth.apiRequest('/drive/sync-studios', {
                method: 'POST'
            });
        }
    },

    // Policies
    policies: {
        async getAll() {
            return await Auth.apiRequest('/policies');
        },
        async getById(id) {
            return await Auth.apiRequest(`/policies/${id}`);
        },
        async create(data) {
            return await Auth.apiRequest('/policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async update(id, data) {
            return await Auth.apiRequest(`/policies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },
        async delete(id) {
            return await Auth.apiRequest(`/policies/${id}`, {
                method: 'DELETE'
            });
        }
    }
};

// ========================================
// Global Event Handlers
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', App.toggleSidebar);
    }
});

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, API };
}
