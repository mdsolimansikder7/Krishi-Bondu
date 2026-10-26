import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Application, Request, Response } from 'express';

export function createVercelHandler(createApp: () => Promise<Application>) {
  let appPromise: Promise<Application> | undefined;

  return async function vercelHandler(req: VercelRequest, res: VercelResponse) {
    appPromise ??= createApp();
    try {
      const app = await appPromise;
      app(req as Request, res as unknown as Response);
    } catch (error) {
      appPromise = undefined;
      console.error('Unable to initialize Vercel API handler:', error);
      res.status(500).json({ error: 'API initialization failed.' });
    }
  };
}
