const { Pool, types } = require('pg');

// Postgres DATE columns (OID 1082) come back from pg as JS Date objects by
// default, which serialize to full ISO timestamps (e.g. "2026-09-01T00:00:00.000Z").
// The frontend matches dates as plain "YYYY-MM-DD" strings, so we tell pg to
// hand back the raw wire text instead of parsing it into a Date.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;