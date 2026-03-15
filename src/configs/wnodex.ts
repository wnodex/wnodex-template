import { Wnodex } from 'wnodex';

import { corsWhitelist } from '~/consts/cors-whitelist.js';

export const wnodex = new Wnodex({
  port: 3000,
  compression: false,
  bodyParsers: {
    json: { limit: '500mb' },
    urlencoded: { limit: '500mb', extended: true },
  },
  helmet: false,
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || corsWhitelist.test(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'X-Requested-With',
      'X-Custom-Header',
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limit each IP to 100 requests per windowMs
  },
});
