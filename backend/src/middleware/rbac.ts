import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

export const hasRole = (requiredRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("ERR_NOT_AUTHENTICATED", 401);
    }

    const userRoles = req.user.roles || [];
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new AppError("ERR_INSUFFICIENT_PERMISSIONS", 403);
    }

    next();
  };
};

export const isSuperAdmin = hasRole("super_admin");
export const isAdmin = hasRole(["admin", "super_admin"]);
export const isAgent = hasRole(["agent", "admin", "super_admin"]);
export const isUser = hasRole(["user", "agent", "admin", "super_admin"]);

// Check if user has specific profile (legacy support)
export const hasProfile = (requiredProfiles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("ERR_NOT_AUTHENTICATED", 401);
    }

    const userProfile = req.user.profile;
    const profiles = Array.isArray(requiredProfiles) ? requiredProfiles : [requiredProfiles];

    const hasRequiredProfile = profiles.includes(userProfile);

    if (!hasRequiredProfile) {
      throw new AppError("ERR_INSUFFICIENT_PERMISSIONS", 403);
    }

    next();
  };
};

// Legacy compatibility middleware (maps old isSuper to new RBAC)
export const isSuper = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError("ERR_NOT_AUTHENTICATED", 401);
  }

  // Check both roles and profile for backward compatibility
  const hasSuperRole = req.user.roles?.includes("super_admin");
  const hasSuperProfile = req.user.profile === "super";

  if (!hasSuperRole && !hasSuperProfile) {
    throw new AppError("ERR_INSUFFICIENT_PERMISSIONS", 403);
  }

  next();
};