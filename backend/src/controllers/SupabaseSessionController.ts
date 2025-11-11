import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export const signIn = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new AppError(error.message, 401);
    }

    return res.status(200).json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata,
        app_metadata: data.user?.app_metadata
      }
    });
  } catch (error) {
    logger.error("Supabase signIn error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_AUTHENTICATION_FAILED", 401);
  }
};

export const signUp = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, user_metadata = {}, app_metadata = {} } = req.body;

  try {
    const { data, error } = await supabaseService.auth.admin.createUser({
      email,
      password,
      user_metadata,
      app_metadata,
      email_confirm: true
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    return res.status(201).json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata,
        app_metadata: data.user?.app_metadata
      }
    });
  } catch (error) {
    logger.error("Supabase signUp error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_USER_CREATION_FAILED", 400);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new AppError("ERR_REFRESH_TOKEN_REQUIRED", 400);
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      throw new AppError(error.message, 401);
    }

    return res.status(200).json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata,
        app_metadata: data.user?.app_metadata
      }
    });
  } catch (error) {
    logger.error("Supabase refreshToken error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_TOKEN_REFRESH_FAILED", 401);
  }
};

export const signOut = async (req: Request, res: Response): Promise<Response> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      await supabaseService.auth.admin.signOut(token);
    } catch (error) {
      logger.error("Supabase signOut error:", error);
      // Continue even if signOut fails
    }
  }

  return res.status(200).json({ message: "Signed out successfully" });
};

export const getUser = async (req: Request, res: Response): Promise<Response> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: { user }, error } = await supabaseService.auth.getUser(token);

    if (error || !user) {
      throw new AppError("ERR_INVALID_TOKEN", 401);
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    logger.error("Supabase getUser error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_GET_USER_FAILED", 401);
  }
};

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const { user_metadata, app_metadata } = req.body;
  const userId = req.params.userId || req.user?.id;

  if (!userId) {
    throw new AppError("ERR_USER_ID_REQUIRED", 400);
  }

  try {
    const updateData: any = {};
    
    if (user_metadata) {
      updateData.user_metadata = user_metadata;
    }
    
    if (app_metadata) {
      updateData.app_metadata = app_metadata;
    }

    const { data, error } = await supabaseService.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (error) {
      throw new AppError(error.message, 400);
    }

    return res.status(200).json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata,
        app_metadata: data.user?.app_metadata
      }
    });
  } catch (error) {
    logger.error("Supabase updateUser error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_USER_UPDATE_FAILED", 400);
  }
};