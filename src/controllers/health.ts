import { Request, Response } from 'express';

/**
 * Health check controller.
 * Returns 200 OK to indicate the server is running.
 */
export const healthCheck = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
};
