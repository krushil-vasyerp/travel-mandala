const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const stateRoutes = require('./routes/state.routes');
const memberRoutes = require('./routes/members.routes');
const paymentRoutes = require('./routes/payments.routes');
const settingsRoutes = require('./routes/settings.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/state', stateRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });

  return app;
}

module.exports = createApp;
