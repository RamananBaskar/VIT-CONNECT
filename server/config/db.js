const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connect to MongoDB via MONGODB_URI, or fall back to mongodb-memory-server
 * when USE_MEMORY_DB=auto (or true) so the app runs out-of-the-box without
 * requiring a separate local mongod service.
 */
async function connectDB() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in production.');
    }
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    } catch {
      throw new Error('MongoDB connection failed. Check the Atlas connection settings and network access.');
    }
    console.log('MongoDB connected.');
    return { isMemory: false };
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vit_connect';
  const mode = (process.env.USE_MEMORY_DB || 'auto').toLowerCase();

  if (mode !== 'true') {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log('MongoDB connected.');
      return { isMemory: false };
    } catch (err) {
      if (mode === 'false') {
        throw err;
      }
      console.warn('MongoDB unavailable. Starting mongodb-memory-server...');
    }
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memUri = memoryServer.getUri();
  await mongoose.connect(memUri);
  console.log('MongoDB Memory Server connected.');
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
