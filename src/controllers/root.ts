import { Request, Response } from 'express';

/**
 * Root controller.
 * Returns a courtesy text.
 */
export const getRoot = (_req: Request, res: Response): void => {
  res.status(200).send('wnodex has started, this is your main page, change me');
};
