require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seedData');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'vit-connect-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);

let dbInitPromise = null;

async function initDB() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const { isMemory } = await connectDB();
      const seedRes = await seedDatabase({ reset: false });
      if (!seedRes.skipped) {
        console.log(
          `Seeded initial data (${isMemory ? 'in-memory MongoDB' : 'MongoDB'}): ${seedRes.usersCreated} users, ${seedRes.eventsCreated} events`
        );
      }
    })();
  }
  return dbInitPromise;
}

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`VIT Connect API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, initDB };
