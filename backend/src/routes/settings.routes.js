const router = require('express').Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { emit } = require('../sockets');

// Powers both the +/- month buttons and (later, if you want it) a
// monthly-amount editor. The frontend always sends the full triple.
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { monthlyAmount, startMonth, endMonth } = req.body || {};
    if (!monthlyAmount || monthlyAmount <= 0) {
      return res.status(400).json({ error: 'monthlyAmount must be a positive number.' });
    }
    if (!startMonth || isNaN(Date.parse(startMonth))) {
      return res.status(400).json({ error: 'A valid startMonth date is required.' });
    }
    if (!endMonth || isNaN(Date.parse(endMonth))) {
      return res.status(400).json({ error: 'A valid endMonth date is required.' });
    }
    if (new Date(endMonth) < new Date(startMonth)) {
      return res.status(400).json({ error: 'endMonth cannot be before startMonth.' });
    }
    const r = await pool.query(
      `UPDATE settings
       SET monthly_amount = $1, start_month = $2, end_month = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [monthlyAmount, startMonth, endMonth]
    );
    emit('settingsUpdated', r.rows[0]);
    res.json(r.rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
