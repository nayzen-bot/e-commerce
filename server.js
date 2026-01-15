const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const db = require('./database/init_db');
const { log } = require('./utils/logger');
const { requireIPAuth } = require('./middleware/ip-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline styles for animations
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'images', 'products'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Seules les images sont autorisées'));
    }
});

// Make upload middleware available globally
app.locals.upload = upload;

// Session management
app.use(session({
    secret: 'shoptonidf-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});

app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

app.get('/tracking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});

app.get('/legal', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'legal.html'));
});

app.get('/payment-loading', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-loading.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// Admin routes - IP protected
app.get('/admin', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/admin/products', (req, res) => {
    res.redirect('/dashboard/products');
});

app.get('/admin/orders', (req, res) => {
    res.redirect('/dashboard/orders');
});

app.get('/dashboard', requireIPAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.get('/dashboard/products', requireIPAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'));
});

app.get('/dashboard/orders', requireIPAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'orders.html'));
});

// Image upload endpoint
app.post('/api/upload-image', requireIPAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    const imagePath = '/images/products/' + req.file.filename;
    log('IMAGE_UPLOAD', `Image uploaded: ${imagePath}`);

    res.json({
        success: true,
        imagePath: imagePath
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page non trouvée');
});

// Error handler
app.use((err, req, res, next) => {
    log('ERROR', err.stack);
    res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✨ shopTonIDF server running on http://localhost:${PORT}\n`);
    log('SERVER_START', `Server started on port ${PORT}`);
});
