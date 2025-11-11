import { Request, Response, NextFunction } from 'express';

// Estender a interface Request para incluir tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const tenantPropagation = (req: Request, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    res.status(400).json({ error: "Missing tenant_id" });
    return;
  }

  req.tenantId = tenantId;
  next();
};