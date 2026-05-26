import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Core Invariants
import db from './src/server/db.js';
import { audit } from './src/server/utils/audit.js';
import { getCorsConfig } from './src/server/config/corsConfig.js';
import { globalLimiter } from './src/server/middleware/globalLimiter.js';
import { startBackupSchedule } from './src/server/utils/backup.js';

// Feature Routers
import authRouter from './src/server/routes/auth.js';
import agentKeysRouter from './src/server/routes/agentKeys.js';
import adminRouter from './src/server/routes/admin.js';
import { storageRouter, storageSystemRouter } from './src/server/routes/storageRouter.js';
import schemaRouter from './src/server/routes/schemaRouter.js';
import dataRouter from './src/server/routes/dataRouter.js';
import systemRouter from './src/server/routes/systemRouter.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // --- Security Membrane ---
  app.use(helmet({
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    xssFilter: true,
    noSniff: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://static.cloudflareinsights.com"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'https:', 'data:'],
        connectSrc: ["'self'", 'wss:', 'ws:', "https://cloudflareinsights.com"],
        frameAncestors: isProduction ? ["'self'"] : ["'self'", "*"],
        upgradeInsecureRequests: process.env.ENFORCE_HTTPS === 'true' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    frameguard: { action: 'sameorigin' },
  }));

  app.use(globalLimiter);
  app.use(cors(getCorsConfig()));
  app.use(express.json());
  app.use(cookieParser());

  // --- API Health & Info ---
  app.get('/api/health', (req, res) => res.json({ 
    status: 'ok',
    tunnelUrl: process.env.CLOUDFLARE_TUNNEL_URL || null
  }));
  app.get('/api/info', (req, res) => res.json({ name: 'CaraBase', version: '2.0.0' }));

  // --- Feature Routing ---
  app.use('/api/auth', authRouter);
  app.use('/api/agent-keys', agentKeysRouter);
  app.use('/api/admin', adminRouter);

  // System Management
  app.use('/api/system', systemRouter);
  app.use('/api/system', schemaRouter);
  app.use('/api/system/storage', storageSystemRouter);

  // Data Membranes
  app.use('/rest/v1', dataRouter);
  app.use('/storage', storageRouter);

  // --- Frontend & Assets ---
  if (!isProduction) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/storage') || req.path.startsWith('/rest')) {
        return res.status(404).json({ error: 'Not Found' });
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/storage') || req.path.startsWith('/rest')) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Global Error Boundary ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Global Error Boundary]', err);
    try {
       audit.log('SYSTEM_FATAL_ERROR', {
         actor: 'system',
         actor_type: 'system',
         resource: 'backend',
         action: 'crash',
         outcome: 'failure',
         ip_address: req.ip || req.socket.remoteAddress || 'unknown',
         user_agent: req.headers['user-agent'] || '',
         details: { message: err.message, path: req.path }
       });
    } catch (auditErr) {
       console.error('[Audit Logger Failed in Error Boundary]', auditErr);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  });

  const sessionId = uuidv4();
  const HOST = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');

  app.listen(PORT, HOST, () => {
    console.log(`\n🔑 System auth and REST routes ready.`);
    console.log(`🦞 CaraBase API running on port \${PORT}`);

    audit.log('SYSTEM_START', {
      action: 'system_start',
      outcome: 'success',
      details: { session_id: sessionId, port: PORT }
    });

    startBackupSchedule(db);
  });

  // Graceful Shutdown
  function handleShutdown(signal: string) {
    console.log(`\n[Server] Received \${signal}. Shutting down gracefully...`);
    try {
      audit.log('SYSTEM_SHUTDOWN', {
        action: 'shutdown',
        outcome: 'success',
        details: { signal, session_id: sessionId }
      });
    } catch (err: any) {
      console.error('[Shutdown Log Error]', err.message);
    }
    try {
      db.close();
      console.log('[Database] Securely closed.');
    } catch (dbErr: any) {
      console.error('[Database Close Error]', dbErr.message);
    }
    process.exit(0);
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
