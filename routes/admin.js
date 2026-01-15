const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/init_db');
const { requireIPAuth } = require('../middleware/ip-auth');
const { validateProductData } = require('../utils/validation');
const { log, logError, logSuccess } = require('../utils/logger');

// Note: Login/Logout routes are removed as we use IP-based authentication

/**
 * GET /api/admin/check - Check if admin is authorized (IP based)
 */
router.get('/check', requireIPAuth, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        admin: { email: 'admin@shoptonidf.local' }
    });
});

/**
 * GET /api/admin/stats - Dashboard statistics
 */
router.get('/stats', requireIPAuth, (req, res) => {
    const stats = {};

    // Total products
    db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
        if (err) {
            logError('ADMIN_STATS', err.message);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        stats.total_products = result.count;

        // Total orders
        db.get('SELECT COUNT(*) as count FROM orders', (err, result) => {
            if (err) {
                logError('ADMIN_STATS', err.message);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
            stats.total_orders = result.count;

            // Pending payments
            db.get('SELECT COUNT(*) as count FROM orders WHERE payment_status = "pending"', (err, result) => {
                if (err) {
                    logError('ADMIN_STATS', err.message);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }
                stats.pending_payments = result.count;

                // Total revenue
                db.get('SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = "verified"', (err, result) => {
                    if (err) {
                        logError('ADMIN_STATS', err.message);
                        return res.status(500).json({ success: false, message: 'Erreur serveur' });
                    }
                    stats.total_revenue = result.revenue || 0;

                    // Low stock products
                    db.all('SELECT * FROM products WHERE stock < 10 ORDER BY stock ASC', (err, products) => {
                        if (err) {
                            logError('ADMIN_STATS', err.message);
                            return res.status(500).json({ success: false, message: 'Erreur serveur' });
                        }
                        stats.low_stock_products = products;

                        res.json({ success: true, stats });
                    });
                });
            });
        });
    });
});

/**
 * GET /api/admin/orders - Get all orders
 */
router.get('/orders', requireIPAuth, (req, res) => {
    const { status, payment_status, limit = 100 } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (payment_status) {
        query += ' AND payment_status = ?';
        params.push(payment_status);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    db.all(query, params, (err, orders) => {
        if (err) {
            logError('ADMIN_ORDERS_FETCH', err.message);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        res.json({ success: true, orders });
    });
});

/**
 * PATCH /api/admin/orders/:id/payment - Update payment status
 */
router.patch('/orders/:id/payment', requireIPAuth, (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!['pending', 'verified', 'failed'].includes(payment_status)) {
        return res.status(400).json({ success: false, message: 'Statut de paiement invalide' });
    }

    db.run(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        [payment_status, id],
        function (err) {
            if (err) {
                logError('ADMIN_PAYMENT_UPDATE', err.message);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Commande introuvable' });
            }

            logSuccess('ADMIN_PAYMENT_UPDATE', `Order #${id} payment status: ${payment_status}`);
            res.json({ success: true, message: 'Statut de paiement mis à jour' });
        }
    );
});

/**
 * PATCH /api/admin/orders/:id/delivery - Update delivery status
 */
router.patch('/orders/:id/delivery', requireIPAuth, (req, res) => {
    const { id } = req.params;
    const { delivery_status } = req.body;

    const validStatuses = ['pending', 'preparing', 'shipped', 'delivered'];
    if (!validStatuses.includes(delivery_status)) {
        return res.status(400).json({ success: false, message: 'Statut de livraison invalide' });
    }

    db.run(
        'UPDATE orders SET delivery_status = ? WHERE id = ?',
        [delivery_status, id],
        function (err) {
            if (err) {
                logError('ADMIN_DELIVERY_UPDATE', err.message);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Commande introuvable' });
            }

            logSuccess('ADMIN_DELIVERY_UPDATE', `Order #${id} delivery status: ${delivery_status}`);
            res.json({ success: true, message: 'Statut de livraison mis à jour' });
        }
    );
});

/**
 * POST /api/admin/products - Create product
 */
router.post('/products', requireIPAuth, (req, res) => {
    const validation = validateProductData(req.body);
    if (!validation.valid) {
        return res.status(400).json({ success: false, errors: validation.errors });
    }

    const { name, description, price, stock, category, featured, image } = req.body;

    db.run(
        `INSERT INTO products (name, description, price, stock, category, featured, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, description || '', price, stock, category || 'Général', featured ? 1 : 0, image || ''],
        function (err) {
            if (err) {
                logError('ADMIN_PRODUCT_CREATE', err.message);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            logSuccess('ADMIN_PRODUCT_CREATE', `Product created: ${name}`);
            res.json({
                success: true,
                message: 'Produit créé',
                product_id: this.lastID
            });
        }
    );
});

/**
 * PUT /api/admin/products/:id - Update product
 */
router.put('/products/:id', requireIPAuth, (req, res) => {
    const { id } = req.params;
    const validation = validateProductData(req.body);

    if (!validation.valid) {
        return res.status(400).json({ success: false, errors: validation.errors });
    }

    const { name, description, price, stock, category, featured, image } = req.body;

    db.run(
        `UPDATE products 
     SET name = ?, description = ?, price = ?, stock = ?, category = ?, featured = ?, image = ?
     WHERE id = ?`,
        [name, description, price, stock, category, featured ? 1 : 0, image, id],
        function (err) {
            if (err) {
                logError('ADMIN_PRODUCT_UPDATE', err.message);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Produit introuvable' });
            }

            logSuccess('ADMIN_PRODUCT_UPDATE', `Product #${id} updated`);
            res.json({ success: true, message: 'Produit mis à jour' });
        }
    );
});

/**
 * DELETE /api/admin/products/:id - Delete product
 */
router.delete('/products/:id', requireIPAuth, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) {
            logError('ADMIN_PRODUCT_DELETE', err.message);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Produit introuvable' });
        }

        logSuccess('ADMIN_PRODUCT_DELETE', `Product #${id} deleted`);
        res.json({ success: true, message: 'Produit supprimé' });
    });
});

module.exports = router;
