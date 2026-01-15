/**
 * Authentication middleware for admin routes
 */

function requireAuth(req, res, next) {
    if (req.session && req.session.adminId) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: 'Non autorisé. Veuillez vous connecter.'
    });
}

module.exports = {
    requireAuth
};
