import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAuth } from './middleware/auth.js';
import { createAuthRouter } from './routes/auth.js';
import { createSongsRouter } from './routes/songs.js';
import { createMeRouter } from './routes/me.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, '..');
const publicDir = path.join(serverRoot, 'public');
const clientDist = path.resolve(serverRoot, '..', 'client', 'dist');

export function createApp({ db, config }) {
  const app = express();
  const auth = createAuth(config.jwtSecret);

  const allowedOrigins = String(config.clientOrigin || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(
    cors((req, callback) => {
      const origin = req.headers.origin;
      const sameOrigin = origin && origin === `${req.protocol}://${req.headers.host}`;
      const allowed =
        !origin ||
        sameOrigin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin);

      callback(null, { origin: allowed ? origin || true : false });
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'tarara-music-api',
      database: db.driver,
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', createAuthRouter({ db, config }));
  app.use('/api', createSongsRouter({ db, optionalAuth: auth.optional }));
  app.use('/api', createMeRouter({ db, config, requireAuth: auth.required }));

  app.use('/media', express.static(path.join(publicDir, 'media'), { maxAge: '1h' }));
  app.use('/covers', express.static(path.join(publicDir, 'covers'), { maxAge: '1d' }));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.' });
  });

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((err, _req, res, _next) => {
    const status = Number(err.status) || 500;
    if (status >= 500 && config.nodeEnv !== 'test') {
      console.error('[tarara-music]', err);
    }
    res.status(status).json({
      error: status >= 500 ? 'Error interno del servidor.' : err.message
    });
  });

  return app;
}
