// ========================================
// Admin Panel JavaScript
// ========================================

// No authentication check needed - IP-based access

// Load dashboard stats
async function loadDashboardStats() {
    try {
        Animations.showLoading('Chargement des statistiques...');
        const response = await API.getAdminStats();

        if (response.success) {
            const stats = response.stats;

            // Update stat cards
            document.getElementById('stat-products').textContent = stats.total_products;
            document.getElementById('stat-orders').textContent = stats.total_orders;
            document.getElementById('stat-pending').textContent = stats.pending_payments;
            document.getElementById('stat-revenue').textContent = AppUtils.formatCurrency(stats.total_revenue);

            // Display low stock products
            if (stats.low_stock_products && stats.low_stock_products.length > 0) {
                const alertsContainer = document.getElementById('low-stock-alerts');
                alertsContainer.innerHTML = stats.low_stock_products.map(product => `
          <div class="alert alert-warning">
            <strong>${product.name}</strong> - Stock faible: ${product.stock} unités restantes
          </div>
        `).join('');
            }
        }

        Animations.hideLoading();
    } catch (error) {
        Animations.hideLoading();
        Animations.showError('Erreur lors du chargement des statistiques');
    }
}

// Load products for admin
async function loadAdminProducts() {
    try {
        Animations.showLoading('Chargement des produits...');
        const response = await API.getProducts();

        if (response.success) {
            const tbody = document.getElementById('products-table-body');
            tbody.innerHTML = response.products.map(product => `
        <tr>
          <td>${product.id}</td>
          <td><strong>${product.name}</strong></td>
          <td>${product.category}</td>
          <td>${AppUtils.formatCurrency(product.price)}</td>
          <td>
            <span class="badge ${product.stock < 10 ? 'badge-warning' : 'badge-success'}">
              ${product.stock}
            </span>
          </td>
          <td>
            <span class="badge ${product.featured ? 'badge-primary' : 'badge-secondary'}">
              ${product.featured ? 'Oui' : 'Non'}
            </span>
          </td>
          <td class="table-actions">
            <button class="action-btn" onclick="editProduct(${product.id})">✏️ Modifier</button>
            <button class="action-btn delete" onclick="deleteProduct(${product.id})">🗑️ Supprimer</button>
          </td>
        </tr>
      `).join('');
        }

        Animations.hideLoading();
    } catch (error) {
        console.error('loadAdminProducts error:', error);
        Animations.hideLoading();
        Animations.showError('Erreur lors du chargement des produits: ' + error.message);
    }
}

// Load orders for admin
async function loadAdminOrders() {
    try {
        Animations.showLoading('Chargement des commandes...');
        const response = await API.getAdminOrders();

        if (response.success) {
            const tbody = document.getElementById('orders-table-body');
            tbody.innerHTML = response.orders.map(order => `
        <tr>
          <td>#${order.id}</td>
          <td>${order.customer_name}</td>
          <td>${order.customer_email}</td>
          <td>${order.paypal_name}</td>
          <td>${AppUtils.formatCurrency(order.total_amount)}</td>
          <td>
            <select class="form-select" onchange="updatePaymentStatus(${order.id}, this.value)">
              <option value="pending" ${order.payment_status === 'pending' ? 'selected' : ''}>En attente</option>
              <option value="verified" ${order.payment_status === 'verified' ? 'selected' : ''}>Vérifié</option>
              <option value="failed" ${order.payment_status === 'failed' ? 'selected' : ''}>Échoué</option>
            </select>
          </td>
          <td>
            <select class="form-select" onchange="updateDeliveryStatus(${order.id}, this.value)">
              <option value="pending" ${order.delivery_status === 'pending' ? 'selected' : ''}>En attente</option>
              <option value="preparing" ${order.delivery_status === 'preparing' ? 'selected' : ''}>Préparation</option>
              <option value="shipped" ${order.delivery_status === 'shipped' ? 'selected' : ''}>Expédié</option>
              <option value="delivered" ${order.delivery_status === 'delivered' ? 'selected' : ''}>Livré</option>
            </select>
          </td>
          <td>${AppUtils.formatDate(order.created_at)}</td>
        </tr>
      `).join('');
        }

        Animations.hideLoading();
    } catch (error) {
        Animations.hideLoading();
        Animations.showError('Erreur lors du chargement des commandes');
    }
}

// Update payment status
async function updatePaymentStatus(orderId, status) {
    try {
        const response = await API.updatePaymentStatus(orderId, status);
        if (response.success) {
            Animations.showSuccess('Statut de paiement mis à jour');
        }
    } catch (error) {
        Animations.showError('Erreur lors de la mise à jour');
        loadAdminOrders();
    }
}

// Update delivery status
async function updateDeliveryStatus(orderId, status) {
    try {
        const response = await API.updateDeliveryStatus(orderId, status);
        if (response.success) {
            Animations.showSuccess('Statut de livraison mis à jour');
        }
    } catch (error) {
        Animations.showError('Erreur lors de la mise à jour');
        loadAdminOrders();
    }
}

// Show product form for edit
async function editProduct(productId) {
    try {
        const response = await API.getProduct(productId);
        if (response.success) {
            const product = response.product;

            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-featured').checked = product.featured === 1;
            document.getElementById('product-image').value = product.image;

            document.getElementById('product-form-section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        Animations.showError('Erreur lors du chargement du produit');
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        return;
    }

    try {
        Animations.showLoading('Suppression...');
        const response = await API.deleteProduct(productId);

        if (response.success) {
            Animations.showSuccess('Produit supprimé');
            loadAdminProducts();
        }

        Animations.hideLoading();
    } catch (error) {
        Animations.hideLoading();
        Animations.showError('Erreur lors de la suppression');
    }
}

// Handle image upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        Animations.showLoading('Upload de l\'image...');
        const response = await API.uploadImage(file);

        if (response.success) {
            document.getElementById('product-image').value = response.imagePath;
            Animations.showSuccess('Image uploadée avec succès !');
        }

        Animations.hideLoading();
    } catch (error) {
        Animations.hideLoading();
        Animations.showError('Erreur lors de l\'upload: ' + error.message);
    }
}

// Handle product form submission
async function handleProductSubmit(event) {
    event.preventDefault();

    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        featured: document.getElementById('product-featured').checked,
        image: document.getElementById('product-image').value || '/images/products/default.jpg'
    };

    try {
        Animations.showLoading(productId ? 'Mise à jour...' : 'Création...');

        let response;
        if (productId) {
            response = await API.updateProduct(productId, productData);
        } else {
            response = await API.createProduct(productData);
        }

        if (response.success) {
            Animations.showSuccess(productId ? 'Produit mis à jour' : 'Produit créé');
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            loadAdminProducts();
        }

        Animations.hideLoading();
    } catch (error) {
        Animations.hideLoading();
        Animations.showError('Erreur lors de l\'enregistrement');
    }
}

// Export functions
window.loadDashboardStats = loadDashboardStats;
window.loadAdminProducts = loadAdminProducts;
window.loadAdminOrders = loadAdminOrders;
window.updatePaymentStatus = updatePaymentStatus;
window.updateDeliveryStatus = updateDeliveryStatus;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.handleImageUpload = handleImageUpload;
window.handleProductSubmit = handleProductSubmit;
