const express = require('express');
const router = express.Router();
const db = require('../database/init_db');
const { validateOrderData } = require('../utils/validation');
const { validateIDFAddress } = require('../utils/idf-validator');
const { log, logError, logSuccess } = require('../utils/logger');

/**
 * POST /api/orders - Create new order
 */
router.post('/', async (req, res) => {
    const orderData = req.body;

    // Validate input
    const validation = validateOrderData(orderData);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: 'Données invalides',
            errors: validation.errors
        });
    }

    // Validate Île-de-France address
    const addressValidation = validateIDFAddress(orderData.city, orderData.postal_code);
    if (!addressValidation.valid) {
        logError('ORDER_VALIDATION', `Invalid IDF address: ${orderData.city} ${orderData.postal_code}`);
        return res.status(400).json({
            success: false,
            message: addressValidation.message,
            idf_error: true
        });
    }

    // Verify stock and calculate total
    let totalAmount = 0;
    const productChecks = [];

    for (const item of orderData.items) {
        productChecks.push(
            new Promise((resolve, reject) => {
                db.get(
                    'SELECT id, name, price, stock FROM products WHERE id = ?',
                    [item.product_id],
                    (err, product) => {
                        if (err) {
                            reject(err);
                        } else if (!product) {
                            reject(new Error(`Produit ${item.product_id} introuvable`));
                        } else if (product.stock < item.quantity) {
                            reject(new Error(`Stock insuffisant pour ${product.name} (disponible: ${product.stock})`));
                        } else {
                            totalAmount += product.price * item.quantity;
                            resolve({ product, quantity: item.quantity });
                        }
                    }
                );
            })
        );
    }

    try {
        const validatedItems = await Promise.all(productChecks);

        // Start transaction - create order
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const insertOrder = `
        INSERT INTO orders (
          customer_name, customer_email, customer_phone,
          city, postal_code, address, paypal_name, total_amount,
          status, payment_status, delivery_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', 'pending', 'pending')
      `;

            db.run(
                insertOrder,
                [
                    orderData.customer_name,
                    orderData.customer_email,
                    orderData.customer_phone || '',
                    orderData.city,
                    orderData.postal_code,
                    orderData.address,
                    orderData.paypal_name,
                    totalAmount.toFixed(2)
                ],
                function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        logError('ORDER_CREATION', err.message);
                        return res.status(500).json({ success: false, message: 'Erreur lors de la création de la commande' });
                    }

                    const orderId = this.lastID;

                    // Insert order items and decrement stock
                    let itemsInserted = 0;
                    validatedItems.forEach(({ product, quantity }) => {
                        // Insert order item
                        db.run(
                            'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                            [orderId, product.id, quantity, product.price],
                            (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    logError('ORDER_ITEM_INSERT', err.message);
                                    return res.status(500).json({ success: false, message: 'Erreur lors de la création de la commande' });
                                }

                                // Decrement stock
                                db.run(
                                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                                    [quantity, product.id],
                                    (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            logError('STOCK_UPDATE', err.message);
                                            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du stock' });
                                        }

                                        itemsInserted++;

                                        // If all items processed, commit
                                        if (itemsInserted === validatedItems.length) {
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    logError('TRANSACTION_COMMIT', err.message);
                                                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                                                }

                                                logSuccess('ORDER_CREATED', `Order #${orderId} for ${orderData.customer_email}`);
                                                res.json({
                                                    success: true,
                                                    message: 'Commande créée avec succès',
                                                    order_id: orderId,
                                                    total_amount: totalAmount.toFixed(2)
                                                });
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    });
                }
            );
        });

    } catch (error) {
        logError('ORDER_VALIDATION', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/orders/:id - Get order details
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
        if (err) {
            logError('ORDER_FETCH', err.message);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande introuvable' });
        }

        // Get order items
        db.all(
            `SELECT oi.*, p.name as product_name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
            [id],
            (err, items) => {
                if (err) {
                    logError('ORDER_ITEMS_FETCH', err.message);
                    return res.status(500).json({ success: false, message: 'Erreur serveur' });
                }

                res.json({
                    success: true,
                    order: {
                        ...order,
                        items
                    }
                });
            }
        );
    });
});

/**
 * GET /api/orders/track/:id - Track order (public endpoint)
 */
router.get('/track/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT id, status, payment_status, delivery_status, created_at FROM orders WHERE id = ?',
        [id],
        (err, order) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            if (!order) {
                return res.status(404).json({ success: false, message: 'Commande introuvable' });
            }

            res.json({ success: true, order });
        }
    );
});

module.exports = router;
