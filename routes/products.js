const express = require('express');
const router = express.Router();
const db = require('../database/init_db');
const { log } = require('../utils/logger');

/**
 * GET /api/products - Get all products
 */
router.get('/', (req, res) => {
    const { category, featured } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (featured) {
        query += ' AND featured = 1';
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, products) => {
        if (err) {
            log('ERROR', `Failed to fetch products: ${err.message}`);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        res.json({ success: true, products });
    });
});

/**
 * GET /api/products/:id - Get single product
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) {
            log('ERROR', `Failed to fetch product ${id}: ${err.message}`);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        if (!product) {
            return res.status(404).json({ success: false, message: 'Produit introuvable' });
        }

        res.json({ success: true, product });
    });
});

/**
 * GET /api/products/category/:category - Get products by category
 */
router.get('/category/:category', (req, res) => {
    const { category } = req.params;

    db.all(
        'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
        [category],
        (err, products) => {
            if (err) {
                log('ERROR', `Failed to fetch products by category: ${err.message}`);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            res.json({ success: true, products });
        }
    );
});

module.exports = router;
