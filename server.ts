import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './server/db/connection.ts';
import { seedDatabase } from './server/utils/seedData.ts';
import authRoutes from './server/routes/authRoutes.ts';
import reportRoutes from './server/routes/reportRoutes.ts';
import workerRoutes from './server/routes/workerRoutes.ts';
import complaintRoutes from './server/routes/complaintRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import uploadRoutes from './server/routes/uploadRoutes.ts';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Connect to MongoDB
  try {
    await connectDB();
    await seedDatabase();
  } catch (err: any) {
    console.error('[Server] Database initialization warning:', err.message);
  }

  // Core Middlewares
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'EcoCivic Smart Waste Management API',
      timestamp: new Date().toISOString(),
    });
  });

  // Re-seed endpoint for demonstration purposes
  app.post('/api/seed/reset', async (_req, res) => {
    try {
      await seedDatabase(true);
      res.json({ success: true, message: 'Database reset to clean demonstration state.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Seed reset failed: ' + err.message });
    }
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/worker', workerRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);

  // Frontend integration: Vite middleware in dev, static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] EcoCivic Smart Waste Management server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Startup failed:', err);
  process.exit(1);
});
