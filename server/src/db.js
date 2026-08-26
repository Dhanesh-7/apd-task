import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log(`[MongoDB] Connected to external MongoDB at ${mongoUri}`);
    } else {
      console.log('[MongoDB] MONGODB_URI not provided. Starting MongoMemoryServer fallback...');
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`[MongoDB] Connected to MongoMemoryServer at ${uri}`);
    }
  } catch (err) {
    console.warn(`[MongoDB] Primary connection failed: ${err.message}. Falling back to MongoMemoryServer...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`[MongoDB] Connected to MongoMemoryServer at ${uri}`);
    } catch (fallbackErr) {
      console.error('[MongoDB] Fatal error starting in-memory database:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
