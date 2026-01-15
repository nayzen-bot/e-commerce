const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    category TEXT,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    address TEXT NOT NULL,
    paypal_name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'created',
    payment_status TEXT DEFAULT 'pending',
    delivery_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

    // Admin users table
    db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Logs table
    db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)`);

    // Insert default admin user
    const adminEmail = 'ssqacsa@gmail.com';
    const adminPassword = 'Sasertariendelenregistrercefemere';

    bcrypt.hash(adminPassword, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }

        db.run(
            `INSERT OR IGNORE INTO admin_users (email, password_hash) VALUES (?, ?)`,
            [adminEmail, hash],
            (err) => {
                if (err) {
                    console.error('Error creating admin user:', err);
                } else {
                    console.log('✓ Admin user created/verified');
                }
            }
        );
    });

    // No sample products - database starts empty as requested by user
    console.log('✓ Database initialized (empty products table)');
});

module.exports = db;
