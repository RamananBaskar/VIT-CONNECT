require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const { seedDatabase } = require('./seedData');

async function runSeed() {
  if (process.env.NODE_ENV === 'production' || process.env.USE_MEMORY_DB !== 'true') {
    console.error('Demo seeding requires USE_MEMORY_DB=true in a local development environment.');
    process.exitCode = 1;
    return;
  }

  try {
    await connectDB();
    const result = await seedDatabase({ reset: true });
    console.log('Seed completed:', result);
    console.log('Default logins:');
    console.log('  Admin:       admin@vit.ac.in / Admin@123');
    console.log('  Club Member: club@vit.ac.in / Club@123 (approved)');
    console.log('  Pending:     pending@vit.ac.in / Pending@123 (pending approval)');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

runSeed();
