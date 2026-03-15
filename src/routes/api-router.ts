import { Router } from 'express';

import { healthCheck } from '../controllers/health.js';

export const apiRouter: Router = Router({ mergeParams: true });

// Health check endpoint
apiRouter.get('/health', healthCheck);
