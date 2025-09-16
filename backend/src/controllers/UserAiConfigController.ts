import { Request, Response } from "express";
import CreateUserAiConfigService from "../services/UserAiServices/CreateUserAiConfigService";
import GetUserAiConfigService from "../services/UserAiServices/GetUserAiConfigService";
import LogAiUsageService from "../services/UserAiServices/LogAiUsageService";
import NewsletterToWhatsappService from "../services/UserAiServices/NewsletterToWhatsappService";
import AppError from "../errors/AppError";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    companyId: number;
    profile: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class UserAiConfigController {
  private createUserAiConfigService: CreateUserAiConfigService;
  private getUserAiConfigService: GetUserAiConfigService;
  private logAiUsageService: LogAiUsageService;
  private newsletterService: NewsletterToWhatsappService;

  constructor() {
    this.createUserAiConfigService = new CreateUserAiConfigService();
    this.getUserAiConfigService = new GetUserAiConfigService();
    this.logAiUsageService = new LogAiUsageService();
    this.newsletterService = new NewsletterToWhatsappService();
  }

  public getConfig = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const config = await this.getUserAiConfigService.execute(userId);

      return res.json({
        success: true,
        data: config
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public saveConfig = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const {
        api_key,
        newsletter_enabled = false,
        chatbot_enabled = false,
        daily_limit = 50,
        preferred_model = 'gpt-4o-mini'
      } = req.body;

      // Validar datos de entrada
      if (!api_key || typeof api_key !== 'string') {
        return res.status(400).json({
          success: false,
          error: "API key is required and must be a string"
        });
      }

      if (daily_limit && (daily_limit < 1 || daily_limit > 1000)) {
        return res.status(400).json({
          success: false,
          error: "Daily limit must be between 1 and 1000"
        });
      }

      await this.createUserAiConfigService.execute({
        userId,
        api_key: api_key.trim(),
        newsletter_enabled,
        chatbot_enabled,
        daily_limit,
        preferred_model
      });

      return res.json({
        success: true,
        message: "AI configuration saved successfully"
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public testApiKey = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const { api_key, model = 'gpt-3.5-turbo' } = req.body;

      if (!api_key || typeof api_key !== 'string') {
        return res.status(400).json({
          success: false,
          error: "API key is required"
        });
      }

      const testResult = await this.createUserAiConfigService.testApiKeyWithModel(
        api_key.trim(),
        model
      );

      return res.json({
        success: true,
        data: testResult
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public getUsageStats = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const { period = 'week' } = req.query;
      
      if (!['day', 'week', 'month'].includes(period as string)) {
        return res.status(400).json({
          success: false,
          error: "Period must be 'day', 'week', or 'month'"
        });
      }

      const stats = await this.logAiUsageService.getUsageStats(userId, period as string);

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public convertNewsletter = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const {
        content,
        content_type = 'text',
        tone = 'professional',
        message_count = 3,
        max_chars_per_message = 300
      } = req.body;

      // Validar datos de entrada
      if (!content || typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Content is required and must be a string"
        });
      }

      const result = await this.newsletterService.execute({
        userId,
        content: content.trim(),
        content_type,
        tone,
        message_count: parseInt(message_count),
        max_chars_per_message: parseInt(max_chars_per_message)
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const {
        newsletter_enabled,
        chatbot_enabled,
        daily_limit,
        preferred_model
      } = req.body;

      // Verificar que el usuario tenga una configuración existente
      const hasValidApiKey = await this.getUserAiConfigService.hasValidApiKey(userId);
      if (!hasValidApiKey) {
        return res.status(400).json({
          success: false,
          error: "API key must be configured first"
        });
      }

      // Validar daily_limit si se proporciona
      if (daily_limit !== undefined && (daily_limit < 1 || daily_limit > 1000)) {
        return res.status(400).json({
          success: false,
          error: "Daily limit must be between 1 and 1000"
        });
      }

      const settings: any = {};
      if (newsletter_enabled !== undefined) settings.newsletter_enabled = newsletter_enabled;
      if (chatbot_enabled !== undefined) settings.chatbot_enabled = chatbot_enabled;
      if (daily_limit !== undefined) settings.daily_limit = daily_limit;
      if (preferred_model !== undefined) settings.preferred_model = preferred_model;

      await this.getUserAiConfigService.updateSettings(userId, settings);

      return res.json({
        success: true,
        message: "Settings updated successfully"
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public deleteConfig = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      await this.createUserAiConfigService.removeApiKey(userId);

      return res.json({
        success: true,
        message: "AI configuration deleted successfully"
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public getDailyLimit = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const limitInfo = await this.getUserAiConfigService.isWithinDailyLimit(userId);

      return res.json({
        success: true,
        data: limitInfo
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public getAvailableModels = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const models = this.createUserAiConfigService.getRecommendedModels();
      const newsletterModels = this.newsletterService.getAvailableModels();

      return res.json({
        success: true,
        data: {
          recommended: models,
          newsletter: newsletterModels
        }
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  public updateApiKey = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated"
        });
      }

      const { api_key } = req.body;

      if (!api_key || typeof api_key !== 'string') {
        return res.status(400).json({
          success: false,
          error: "API key is required"
        });
      }

      await this.createUserAiConfigService.updateApiKey(userId, api_key.trim());

      return res.json({
        success: true,
        message: "API key updated successfully"
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  // Método para administradores - obtener estadísticas del sistema
  public getSystemStats = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.profile !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      const { period = 'week' } = req.query;
      
      const stats = await this.logAiUsageService.getSystemStats(period as string);

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  // Método para administradores - obtener top usuarios
  public getTopUsers = async (req: AuthenticatedRequest, res: Response): Promise<Response<ApiResponse>> => {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.profile !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      const { limit = 10, period = 'week' } = req.query;
      
      const topUsers = await this.logAiUsageService.getTopUsers(
        parseInt(limit as string),
        period as string
      );

      return res.json({
        success: true,
        data: topUsers
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  };

  private handleError(error: any, res: Response): Response<ApiResponse> {
    console.error('UserAiConfigController Error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    // Manejar errores específicos de base de datos
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: "Validation error: " + error.errors.map((e: any) => e.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: "Resource already exists"
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

export default UserAiConfigController;

