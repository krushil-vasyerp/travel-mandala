const router = require('express').Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { emit } = require('../sockets');

// Single UPSERT endpoint — this is what the toggle button hits.
// UNIQUE(member_id, payment_month) + ON CONFLICT prevents duplicate rows
// even if two people tap the same cell at nearly the same time.
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { memberId, paymentMonth, paid } = req.body || {};
    if (!memberId || !paymentMonth || isNaN(Date.parse(paymentMonth)) || typeof paid !== 'boolean') {
      return res.status(400).json({ error: 'memberId, paymentMonth and paid (boolean) are required.' });
    }
    const r = await pool.query(
      `INSERT INTO payments (member_id, payment_month, paid, paid_at)
       VALUES ($1, $2, $3, CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE NULL END)
       ON CONFLICT (member_id, payment_month)
       DO UPDATE SET paid = EXCLUDED.paid, paid_at = EXCLUDED.paid_at
       RETURNING *`,
      [memberId, paymentMonth, paid]
    );
    emit('paymentUpdated', r.rows[0]);
    res.json(r.rows[0]);
  } catch (e) {
    if (e.code === '23503') {
      return res.status(404).json({ error: 'Member not found' });
    }
    next(e);
  }
});

module.exports = router;
