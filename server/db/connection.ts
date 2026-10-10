import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;
let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const explicitUri = process.env.MONGODB_URI;

  if (explicitUri && explicitUri !== 'mongodb://localhost:27017/ecocivic') {
    try {
      console.log(`[Database] Connecting to configured MongoDB: ${explicitUri.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(explicitUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log('[Database] Connected successfully to configured MongoDB');
      return mongoose;
    } catch (err: any) {
      console.warn(`[Database] Connection to configured URI failed (${err.message}). Falling back to MongoMemoryServer...`);
    }
  }

  // Fallback or default: MongoMemoryServer for instant zero-dependency execution
  try {
    if (!mongoMemoryServer) {
      console.log('[Database] Initializing embedded MongoDB engine...');
      mongoMemoryServer = await MongoMemoryServer.create();
    }
    const memoryUri = mongoMemoryServer.getUri();
    console.log(`[Database] Connecting to in-memory MongoDB at ${memoryUri}`);
    await mongoose.connect(memoryUri);
    isConnected = true;
    console.log('[Database] In-memory MongoDB connected successfully with full replica/feature support.');
    return mongoose;
  } catch (memErr: any) {
    console.error('[Database] Fatal: Unable to initialize MongoDB:', memErr.message);
    throw memErr;
  }
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
}
