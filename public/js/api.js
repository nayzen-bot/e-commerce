// ========================================
// API Communication Module
// ========================================

const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/products?${params}`);
    },

    async getProduct(id) {
        return this.request(`/products/${id}`);
    },

    async getFeaturedProducts() {
        return this.request('/products?featured=true');
    },

    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    },

    async trackOrder(id) {
        return this.request(`/orders/track/${id}`);
    },

    async adminLogin(email, password) {
        return this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async adminLogout() {
        return this.request('/admin/logout', {
            method: 'POST'
        });
    },

    async adminCheck() {
        return this.request('/admin/check');
    },

    async getAdminStats() {
        return this.request('/admin/stats');
    },

    async getAdminOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/admin/orders?${params}`);
    },

    async updatePaymentStatus(orderId, status) {
        return this.request(`/admin/orders/${orderId}/payment`, {
            method: 'PATCH',
            body: JSON.stringify({ payment_status: status })
        });
    },

    async updateDeliveryStatus(orderId, status) {
        return this.request(`/admin/orders/${orderId}/delivery`, {
            method: 'PATCH',
            body: JSON.stringify({ delivery_status: status })
        });
    },

    async createProduct(productData) {
        return this.request('/admin/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    async updateProduct(id, productData) {
        return this.request(`/admin/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },

    async deleteProduct(id) {
        return this.request(`/admin/products/${id}`, {
            method: 'DELETE'
        });
    },

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
};

window.API = API;
