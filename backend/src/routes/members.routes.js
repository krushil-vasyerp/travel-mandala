const router = require('express').Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { emit } = require('../sockets');

function validationError(body) {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) {
    return 'Name is required (max 100 characters).';
  }
  if (!body.joinedMonth || isNaN(Date.parse(body.joinedMonth))) {
    return 'A valid joinedMonth date is required.';
  }
  return null;
}

// All routes here mutate data, so all require the admin PIN token.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const err = validationError(req.body);
    if (err) return res.status(400).json({ error: err });
    const { name, joinedMonth } = req.body;
    const r = await pool.query(
      'INSERT INTO members (name, joined_month) VALUES ($1, $2) RETURNING *',
      [name.trim(), joinedMonth]
    );
    emit('memberCreated', r.rows[0]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const err = validationError(req.body);
    if (err) return res.status(400).json({ error: err });
    const { name, joinedMonth } = req.body;
    const r = await pool.query(
      'UPDATE members SET name = $1, joined_month = $2 WHERE id = $3 RETURNING *',
      [name.trim(), joinedMonth, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Member not found' });
    emit('memberUpdated', r.rows[0]);
    res.json(r.rows[0]);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await pool.query('DELETE FROM members WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Member not found' });
    // ON DELETE CASCADE already removed their payment rows in Postgres.
    emit('memberDeleted', { id: Number(req.params.id) });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
