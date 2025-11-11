import { Router } from "express";

import isAuth from "../middleware/isAuth";
import supabaseAuth from "../middleware/supabaseAuth";
import { setRequestContext } from "../middleware/requestContext";
import { isAdmin, hasRole } from "../middleware/rbac";
import * as UserController from "../controllers/UserController";

const userRoutesSupabase = Router();

// Apply Supabase authentication and context middleware
userRoutesSupabase.use(supabaseAuth);
userRoutesSupabase.use(setRequestContext);

userRoutesSupabase.get("/users", hasRole(["admin", "super_admin"]), UserController.index);

userRoutesSupabase.get("/users/list", hasRole(["agent", "admin", "super_admin"]), UserController.list);

userRoutesSupabase.post("/users", isAdmin, UserController.store);

userRoutesSupabase.put("/users/:userId", hasRole(["admin", "super_admin"]), UserController.update);

userRoutesSupabase.get("/users/:userId", hasRole(["agent", "admin", "super_admin"]), UserController.show);

userRoutesSupabase.delete("/users/:userId", isAdmin, UserController.remove);

userRoutesSupabase.post("/users/set-language/:newLanguage", hasRole(["user", "agent", "admin", "super_admin"]), UserController.setLanguage);

export default userRoutesSupabase;