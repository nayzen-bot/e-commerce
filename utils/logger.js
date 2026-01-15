const db = require('../database/init_db');

/**
 * Logger utility for security and debugging
 */

function log(action, details = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${action}: ${details}`);

    // Also log to database
    db.run(
        'INSERT INTO logs (action, details) VALUES (?, ?)',
        [action, details],
        (err) => {
            if (err) {
                console.error('Failed to write log to database:', err);
            }
        }
    );
}

function logError(action, error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`ERROR: ${action}`, errorMsg);
}

function logSuccess(action, details) {
    log(`SUCCESS: ${action}`, details);
}

function logWarning(action, details) {
    log(`WARNING: ${action}`, details);
}

module.exports = {
    log,
    logError,
    logSuccess,
    logWarning
};
