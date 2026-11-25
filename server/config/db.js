const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connect to MongoDB via MONGODB_URI, or fall back to mongodb-memory-server
 * when USE_MEMORY_DB=auto (or true) so the app runs out-of-the-box without
 * requiring a separate local mongod service.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vit_connect';
  const mode = (process.env.USE_MEMORY_DB || 'auto').toLowerCase();

  if (mode !== 'true') {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log(`MongoDB connected: ${uri}`);
      return { isMemory: false };
    } catch (err) {
      if (mode === 'false') {
        throw err;
      }
      console.warn(`Local MongoDB unavailable (${err.message}). Starting mongodb-memory-server...`);
    }
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memUri = memoryServer.getUri();
  await mongoose.connect(memUri);
  console.log(`MongoDB Memory Server connected: ${memUri}`);
  return { isMemory: true };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
