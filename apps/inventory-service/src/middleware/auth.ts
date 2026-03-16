import { Request, Response, NextFunction } from 'express';

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health check
  if (req.path === '/health') return next();

  const apiKey = req.headers['x-service-key'];
  const expectedKey = process.env.INVENTORY_SERVICE_API_KEY;

  if (!expectedKey) {
    console.error('INVENTORY_SERVICE_API_KEY not configured');
    return res.status(500).json({ error: 'Service misconfigured' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
