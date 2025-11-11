import { Request, Response, NextFunction } from "express";
import { TenantContext } from "./tenantContext";
import { logger } from "../utils/logger";

export const setRequestContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user) {
    // Set tenant context for this request
    TenantContext.setContext(req.user.tenantId, req.user.companyId);
    
    logger.debug(`Request context set - Tenant: ${req.user.tenantId}, Company: ${req.user.companyId}`);
    
    // Clear context after response
    const originalSend = res.send;
    res.send = function(data) {
      TenantContext.clearContext();
      return originalSend.call(this, data);
    };

    // Also clear context on response end
    const originalEnd = res.end;
    res.end = function(chunk?, encoding?) {
      TenantContext.clearContext();
      return originalEnd.call(this, chunk, encoding);
    };
  }
  
  next();
};