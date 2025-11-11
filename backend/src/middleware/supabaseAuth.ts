import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SupabaseTokenPayload {
  sub: string; // user id
  email: string;
  user_metadata?: {
    profile?: string;
    tenant_id?: string;
    company_id?: number;
  };
  app_metadata?: {
    roles?: string[];
    tenant_id?: string;
    company_id?: number;
  };
  aud: string;
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        profile: string;
        companyId: number;
        tenantId: string;
        roles: string[];
        supabaseUser?: any;
      };
    }
  }
}

const supabaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError("ERR_INVALID_TOKEN", 401);
    }

    // Decode JWT to get metadata
    const decoded = verify(token, process.env.SUPABASE_JWT_SECRET!) as SupabaseTokenPayload;

    // Extract user information
    const userId = user.id;
    const email = user.email!;
    const profile = user.user_metadata?.profile || user.app_metadata?.profile || "user";
    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id;
    const companyId = user.app_metadata?.company_id || user.user_metadata?.company_id;
    const roles = user.app_metadata?.roles || ["user"];

    if (!tenantId || !companyId) {
      throw new AppError("ERR_MISSING_TENANT_INFO", 403);
    }

    // Attach user info to request
    req.user = {
      id: userId,
      email,
      profile,
      companyId: Number(companyId),
      tenantId,
      roles,
      supabaseUser: user
    };

    logger.info(`Authenticated user: ${email} for tenant: ${tenantId}`);
    next();
  } catch (err) {
    logger.error("Supabase auth error:", err);
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("ERR_AUTHENTICATION_FAILED", 401);
  }
};

export default supabaseAuth;