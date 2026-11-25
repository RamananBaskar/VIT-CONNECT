require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seedData');
const { provisionAdmin } = require('./provisionAdmin');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({ ok, service: 'vit-connect-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found' }));
app.use(express.static(path.resolve(__dirname, '../dist')));

let dbInitPromise = null;

async function initDB() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const { isMemory } = await connectDB();
      if (isMemory) {
        await seedDatabase({ reset: false });
      } else {
        await provisionAdmin();
      }
    })();
  }
  return dbInitPromise;
}

async function start() {
  try {
    await initDB();
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    app.listen(PORT, host, () => {
      console.log(`VIT Connect API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, initDB };
