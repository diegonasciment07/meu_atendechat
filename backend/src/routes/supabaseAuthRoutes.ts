import { Router } from "express";
import * as SupabaseSessionController from "../controllers/SupabaseSessionController";
import supabaseAuth from "../middleware/supabaseAuth";
import { setRequestContext } from "../middleware/requestContext";
import { isAdmin } from "../middleware/rbac";

const supabaseAuthRoutes = Router();

// Public routes - no authentication required
supabaseAuthRoutes.post("/login", SupabaseSessionController.signIn);
supabaseAuthRoutes.post("/refresh", SupabaseSessionController.refreshToken);

// Protected routes - require authentication
supabaseAuthRoutes.use(supabaseAuth);
supabaseAuthRoutes.use(setRequestContext);

supabaseAuthRoutes.post("/logout", SupabaseSessionController.signOut);
supabaseAuthRoutes.get("/me", SupabaseSessionController.getUser);
supabaseAuthRoutes.put("/me", SupabaseSessionController.updateUser);

// Admin routes - require admin role
supabaseAuthRoutes.post("/signup", isAdmin, SupabaseSessionController.signUp);
supabaseAuthRoutes.put("/users/:userId", isAdmin, SupabaseSessionController.updateUser);

export default supabaseAuthRoutes;