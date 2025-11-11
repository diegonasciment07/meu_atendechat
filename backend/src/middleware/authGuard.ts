import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";

interface SupabaseJwtPayload extends JwtPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  email?: string;
  phone?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  role?: string;
}

export default function authGuard(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get Supabase JWT secret from environment
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    if (!jwtSecret) {
      console.error("SUPABASE_JWT_SECRET not configured");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Verify and decode the JWT token
    const decoded = verify(token, jwtSecret) as SupabaseJwtPayload;
    
    // Attach decoded claims to request object
    req.user = {
      id: decoded.sub,
      email: decoded.email || "",
      profile: decoded.user_metadata?.profile || "user",
      companyId: decoded.user_metadata?.company_id || decoded.app_metadata?.company_id || 0,
      tenantId: decoded.user_metadata?.tenant_id || decoded.app_metadata?.tenant_id || "",
      roles: decoded.user_metadata?.roles || decoded.app_metadata?.roles || ["user"],
      supabaseUser: decoded
    };

    next();
  } catch (error) {
    // Token is invalid
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
}