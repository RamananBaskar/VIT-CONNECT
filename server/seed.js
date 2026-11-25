require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const { seedDatabase } = require('./seedData');

async function runSeed() {
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
