const router = require('express').Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { pin } = req.body || {};
  if (!pin || String(pin) !== String(process.env.ADMIN_PIN)) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

module.exports = router;
