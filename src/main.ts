import { existsSync } from 'node:fs';

import type { Logger } from 'pino';
import { ReactRouterSSR, StaticAssets } from '@wnodex/react-router';

import { wnodex } from './configs/wnodex.js';
import { CLIENT_ASSETS_PATH, CLIENT_BUILD_PATH } from './consts/paths.js';
import { PROD } from './consts/prod.js';
import { apiRouter } from './routes/api-router.js';
import { rootRouter } from './routes/root-router.ts';

const app = wnodex.getApp();
const logger = app.get('logger') as Logger;

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Register static assets serving
if (PROD) {
  if (existsSync(CLIENT_ASSETS_PATH)) {
    StaticAssets.register(app, CLIENT_ASSETS_PATH);
  } else {
    logger.warn(`Static assets path not found: ${CLIENT_ASSETS_PATH}`);
  }
}

// Routes
app.use('/api', apiRouter);
app.use('/', rootRouter);

// Register React Router SSR handler (async)
if (PROD) {
  if (existsSync(CLIENT_BUILD_PATH)) {
    await ReactRouterSSR.register(app, CLIENT_BUILD_PATH);
  } else {
    logger.warn(`React Router SSR build path not found: ${CLIENT_BUILD_PATH}`);
  }
}

// --- STARTUP ---
await wnodex.start().then(() => {
  // startup chores
  logger.info('Server started');
});

// --- SHUTDOWN ---
const shutdown = async () => {
  await wnodex.shutdown(() => {
    // shutdown chores
    logger.info('Server stopped');
  });
};

// Graceful shutdown on SIGINT/SIGTERM using Wnodex public method
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// trigger build
