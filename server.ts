/**
 * PharmaPulse ERP - Main Express Server Entry Point
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.js';
import { googleSheetsService } from './server/googleSheets.js';

// Load environment variables
dotenv.config();

// Process crash safety guards
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes mounted FIRST
  app.use('/api', apiRouter);

  // General error handling middleware for API routes to prevent stack traces
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({
      error: 'An internal server error occurred',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  // Determine if running as compiled production bundle or development
  const isCompiledBundle = typeof __filename !== 'undefined' && __filename.endsWith('.cjs');
  const isProduction = process.env.NODE_ENV === 'production' || isCompiledBundle;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PharmaPulse ERP] Server running on http://0.0.0.0:${PORT}`);
    // Auto-verify and populate all 18 sheets in Google Sheets on startup
    googleSheetsService.autoInitializeAllSheets().then((res) => {
      console.log('[PharmaPulse ERP] Google Sheets Auto-Init:', res.message || 'Synced');
    }).catch((err) => {
      console.warn('[PharmaPulse ERP] Google Sheets Auto-Init notice:', err.message);
    });
  });
}

startServer();
