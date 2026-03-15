import { Router } from 'express';

import { getRoot } from '../controllers/root.js';

export const rootRouter: Router = Router({ mergeParams: true });

rootRouter.get('/', getRoot);
