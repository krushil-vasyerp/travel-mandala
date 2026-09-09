const router = require('express').Router();
const pool = require('../db/pool');

// Public: anyone with the link can view the group's data.
router.get('/', async (req, res, next) => {
  try {
    const [settingsR, membersR, paymentsR] = await Promise.all([
      pool.query('SELECT * FROM settings WHERE id = 1'),
      pool.query('SELECT * FROM members ORDER BY id'),
      pool.query('SELECT * FROM payments'),
    ]);
    res.json({
      settings: settingsR.rows[0] || null,
      members: membersR.rows,
      payments: paymentsR.rows,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
