import UserAiConfig from '../../models/UserAiConfig';
import EncryptionService from './EncryptionService';
import AppError from '../../errors/AppError';

interface UserAiConfigResponse {
  id?: number;
  userId: string;
  has_api_key: boolean;
  newsletter_enabled: boolean;
  chatbot_enabled: boolean;
  daily_limit: number;
  usage_count: number;
  last_reset_date: Date | null;
  total_cost: number;
  total_tokens: number;
  preferred_model: string;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class GetUserAiConfigService {
  public async execute(userId: string): Promise<UserAiConfigResponse> {
    try {
      let config = await UserAiConfig.findOne({
        where: { userId }
      });

      // Si no existe configuración, crear una por defecto
      if (!config) {
        config = await UserAiConfig.create({
          userId,
          has_api_key: false,
          newsletter_enabled: false,
          chatbot_enabled: false,
          daily_limit: 50,
          usage_count: 0,
          total_cost: 0,
          total_tokens: 0,
          preferred_model: 'gpt-4o-mini',
          is_active: true
        });
      }

      // Verificar si necesita resetear el contador diario
      await this.checkAndResetDailyUsage(config);

      // Retornar configuración sin la API key encriptada
      return {
        id: config.id,
        userId: String(config.userId),
        has_api_key: config.has_api_key,
        newsletter_enabled: config.newsletter_enabled,
        chatbot_enabled: config.chatbot_enabled,
        daily_limit: config.daily_limit,
        usage_count: config.usage_count,
        last_reset_date: config.last_reset_date,
        total_cost: Number(config.total_cost),
        total_tokens: config.total_tokens,
        preferred_model: config.preferred_model,
        is_active: config.is_active,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get user AI configuration', 500);
    }
  }

  public async getDecryptedApiKey(userId: string): Promise<string | null> {
    try {
      const config = await UserAiConfig.findOne({
        where: { userId, has_api_key: true }
      });

      if (!config || !config.encrypted_api_key) {
        return null;
      }

      return EncryptionService.decrypt(config.encrypted_api_key);
    } catch (error) {
      throw new AppError('Failed to decrypt API key', 500);
    }
  }

  public async hasValidApiKey(userId: string): Promise<boolean> {
    try {
      const apiKey = await this.getDecryptedApiKey(userId);
      return apiKey !== null && EncryptionService.validateApiKeyFormat(apiKey);
    } catch (error) {
      return false;
    }
  }

  private async checkAndResetDailyUsage(config: UserAiConfig): Promise<void> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const lastResetString = config.last_reset_date?.toISOString().split('T')[0];

    if (lastResetString !== todayString) {
      await config.update({
        usage_count: 0,
        last_reset_date: today
      });
    }
  }

  public async isWithinDailyLimit(userId: string): Promise<{ canUse: boolean; current: number; limit: number }> {
    try {
      const config = await this.execute(userId);
      
      return {
        canUse: config.usage_count < config.daily_limit,
        current: config.usage_count,
        limit: config.daily_limit
      };
    } catch (error) {
      throw new AppError('Failed to check daily limit', 500);
    }
  }

  public async incrementUsage(userId: string, tokens: number = 0, cost: number = 0): Promise<void> {
    try {
      const config = await UserAiConfig.findOne({
        where: { userId }
      });

      if (!config) {
        throw new AppError('User AI configuration not found', 404);
      }

      await config.update({
        usage_count: config.usage_count + 1,
        total_tokens: config.total_tokens + tokens,
        total_cost: Number(config.total_cost) + cost
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to increment usage', 500);
    }
  }

  public async updateSettings(userId: string, settings: {
    newsletter_enabled?: boolean;
    chatbot_enabled?: boolean;
    daily_limit?: number;
    preferred_model?: string;
  }): Promise<void> {
    try {
      const config = await UserAiConfig.findOne({
        where: { userId }
      });

      if (!config) {
        throw new AppError('User AI configuration not found', 404);
      }

      await config.update(settings);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update settings', 500);
    }
  }
}

export default GetUserAiConfigService;

