// One-off script: creates tables, and seeds the original 5 members
// only if the members table is currently empty.
// Run with: npm run migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✓ Schema applied.');

  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM members');
  const settingsCheck = await pool.query('SELECT COUNT(*)::int AS c FROM settings');

  if (rows[0].c === 0 && settingsCheck.rows[0].c === 0) {
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seed);
    console.log('✓ Seed data inserted (5 members + initial settings).');
  } else {
    console.log('✓ Data already exists — skipping seed.');
  }

  await pool.end();
  console.log('Done.');
}

run().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
