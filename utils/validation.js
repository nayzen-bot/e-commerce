/**
 * Validation utilities
 */

// Sanitize string input
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

// Validate email with anti-fraud checks
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const trimmed = email.trim().toLowerCase();

    // Basic format check
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;

    // Anti-fraud checks
    const suspicious = [
        /\+{2,}/, // Multiple + signs
        /@{2,}/, // Multiple @ signs
        /\.{2,}/, // Multiple dots in a row
        /@\./, // @ followed immediately by dot
        /\.$/, // Ends with dot
        /^\./, // Starts with dot
        /[^a-zA-Z0-9@._-]/, // Invalid characters
        /test@test/, // Common fake pattern
        /fake@fake/, // Common fake pattern
        /example@example/, // Example emails
        /@example\.com$/, // Example domain
    ];

    for (const pattern of suspicious) {
        if (pattern.test(trimmed)) return false;
    }

    // Check domain has at least 2 characters before TLD
    const domainPart = trimmed.split('@')[1];
    if (!domainPart) return false;

    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false;
    if (domainParts[0].length < 2) return false;

    return true;
}

// Validate phone number with anti-fraud checks
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;

    // Remove common separators
    const cleaned = phone.replace(/[\s.\-()]/g, '');

    // Anti-fraud checks
    const suspicious = [
        /\+{2,}/, // Multiple + signs
        /[a-zA-Z]/, // Contains letters
        /(.)\1{6,}/, // Same digit repeated 7+ times
        /^0{8,}/, // All zeros
        /^1{8,}/, // All ones
        /123456789/, // Sequential pattern
        /987654321/, // Reverse sequential
    ];

    for (const pattern of suspicious) {
        if (pattern.test(cleaned)) return false;
    }

    // French phone format: 10 digits starting with 0, or international +33
    const frenchMobile = /^0[6-7]\d{8}$/;
    const frenchLandline = /^0[1-5]\d{8}$/;
    const international = /^\+33[1-7]\d{8}$/;

    return frenchMobile.test(cleaned) || frenchLandline.test(cleaned) || international.test(cleaned);
}

// Validate address with anti-fraud checks
function validateAddress(address) {
    if (!address || typeof address !== 'string') return false;

    const trimmed = address.trim();

    // Must be at least 5 characters
    if (trimmed.length < 5) return false;

    // Anti-fraud checks
    const suspicious = [
        /^[0-9]+$/, // Only numbers
        /^[a-zA-Z]$/, // Single letter
        /(.)\1{5,}/, // Same character repeated 6+ times
        /^test/i, // Starts with "test"
        /^fake/i, // Starts with "fake"
        /asdf/, // Keyboard mashing
        /qwerty/, // Keyboard pattern
        /^x+$/i, // All x's
        /^a+$/i, // All a's
    ];

    for (const pattern of suspicious) {
        if (pattern.test(trimmed)) return false;
    }

    // Should contain at least one number (street number)
    if (!/\d/.test(trimmed)) return false;

    // Should contain at least one letter
    if (!/[a-zA-Z]/.test(trimmed)) return false;

    return true;
}

// Validate city name
function validateCity(city) {
    if (!city || typeof city !== 'string') return false;

    const trimmed = city.trim();

    // Must be at least 2 characters
    if (trimmed.length < 2) return false;

    // Anti-fraud checks
    const suspicious = [
        /[0-9]/, // Contains numbers
        /(.)\1{4,}/, // Same character repeated 5+ times
        /^test/i,
        /^fake/i,
        /^x+$/i,
        /asdf/,
        /qwerty/,
    ];

    for (const pattern of suspicious) {
        if (pattern.test(trimmed)) return false;
    }

    // Should only contain letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed)) return false;

    return true;
}

function validatePrice(price) {
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0 && num < 1000000;
}

function validateQuantity(quantity) {
    const num = parseInt(quantity, 10);
    return !Number.isNaN(num) && num > 0 && num <= 100;
}

// Validate order data
function validateOrderData(data) {
    const errors = [];

    // Customer name
    if (!data.customer_name || data.customer_name.length < 2) {
        errors.push('Nom invalide');
    }
    if (data.customer_name && data.customer_name.length > 100) {
        errors.push('Nom trop long');
    }
    // Check for suspicious patterns
    if (data.customer_name && /(.)\1{4,}/.test(data.customer_name)) {
        errors.push('Nom invalide - caractères répétés');
    }

    // Email - use enhanced validation
    if (!validateEmail(data.customer_email)) {
        errors.push('Email invalide ou suspect');
    }

    // Phone - use enhanced validation (optional but if provided must be valid)
    if (data.customer_phone && !validatePhone(data.customer_phone)) {
        errors.push('Numéro de téléphone invalide ou suspect');
    }

    // Address - use enhanced validation
    if (!validateAddress(data.address)) {
        errors.push('Adresse invalide ou suspecte');
    }

    // City - use enhanced validation
    if (!validateCity(data.city)) {
        errors.push('Ville invalide ou suspecte');
    }

    // Postal code
    if (!data.postal_code || !/^\d{5}$/.test(data.postal_code)) {
        errors.push('Code postal invalide');
    }

    // PayPal name
    if (!data.paypal_name || data.paypal_name.length < 2) {
        errors.push('Nom PayPal invalide');
    }
    if (data.paypal_name && data.paypal_name.length > 100) {
        errors.push('Nom PayPal trop long');
    }

    // Items
    if (!Array.isArray(data.items) || data.items.length === 0) {
        errors.push('Aucun article dans la commande');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function validateProductData(data) {
    const errors = [];

    if (!data.name || data.name.length < 2) {
        errors.push('Nom de produit invalide');
    }

    if (!validatePrice(data.price)) {
        errors.push('Prix invalide');
    }

    if (!validateQuantity(data.stock) && data.stock !== 0) {
        errors.push('Stock invalide');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    sanitizeString,
    validateEmail,
    validatePhone,
    validatePrice,
    validateQuantity,
    validateOrderData,
    validateProductData
};
