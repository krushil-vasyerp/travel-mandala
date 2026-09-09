const jwt = require('jsonwebtoken');

// Protects mutating routes (add/edit/delete member, mark payment, change settings).
// Viewing (GET /api/state) stays public — only edits require the admin PIN.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

module.exports = { requireAuth };
