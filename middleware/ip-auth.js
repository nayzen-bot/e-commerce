/**
 * IP-based authentication middleware
 * Only allows access from specific IP address
 */

const ALLOWED_IP = '91.167.112.108';

function requireIPAuth(req, res, next) {
  // Get client IP address
  const clientIP = req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  // Remove IPv6 prefix if present (::ffff:)
  const cleanIP = clientIP.replace(/^::ffff:/, '');

  console.log(`Access attempt from IP: ${cleanIP}`);

  if (cleanIP === ALLOWED_IP) {
    return next();
  }

  console.log(`Blocked access from unauthorized IP: ${cleanIP}`);
  return res.status(403).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Accès refusé</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #e74c3c; font-size: 3rem; margin: 0 0 1rem 0; }
        p { color: #555; font-size: 1.2rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚫 Accès Refusé</h1>
        <p>Vous n'êtes pas autorisé à accéder au panneau d'administration.</p>
        <p><small>Votre IP : ${cleanIP}</small></p>
      </div>
    </body>
    </html>
  `);
}

module.exports = {
  requireIPAuth
};
