import OpenAI from 'openai';
import UserAiConfig from '../../models/UserAiConfig';
import EncryptionService from './EncryptionService';
import AppError from '../../errors/AppError';

interface CreateUserAiConfigData {
  userId: string;
  api_key: string;
  newsletter_enabled?: boolean;
  chatbot_enabled?: boolean;
  daily_limit?: number;
  preferred_model?: string;
}

class CreateUserAiConfigService {
  public async execute(data: CreateUserAiConfigData): Promise<void> {
    const {
      userId,
      api_key,
      newsletter_enabled = false,
      chatbot_enabled = false,
      daily_limit = 50,
      preferred_model = 'gpt-4o-mini'
    } = data;

    try {
      // Validar formato de API key
      if (!EncryptionService.validateApiKeyFormat(api_key)) {
        throw new AppError('Invalid API key format', 400);
      }

      // Validar que la API key funcione
      const isValid = await this.validateApiKey(api_key);
      if (!isValid) {
        throw new AppError('Invalid or inactive API key', 400);
      }

      // Encriptar API key
      const encryptedApiKey = EncryptionService.encrypt(api_key);

      // Buscar configuración existente
      let config = await UserAiConfig.findOne({
        where: { userId }
      });

      if (config) {
        // Actualizar configuración existente
        await config.update({
          encrypted_api_key: encryptedApiKey,
          has_api_key: true,
          newsletter_enabled,
          chatbot_enabled,
          daily_limit,
          preferred_model,
          is_active: true
        });
      } else {
        // Crear nueva configuración
        await UserAiConfig.create({
          userId,
          encrypted_api_key: encryptedApiKey,
          has_api_key: true,
          newsletter_enabled,
          chatbot_enabled,
          daily_limit,
          usage_count: 0,
          total_cost: 0,
          total_tokens: 0,
          preferred_model,
          is_active: true,
          last_reset_date: new Date()
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create/update AI configuration', 500);
    }
  }

  public async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const openai = new OpenAI({ apiKey });
      
      // Intentar hacer una llamada simple para validar la key
      const response = await openai.models.list();
      
      // Verificar que la respuesta sea válida
      return response && response.data && Array.isArray(response.data);
    } catch (error) {
      // Si hay error, la API key no es válida
      return false;
    }
  }

  public async testApiKeyWithModel(apiKey: string, model: string = 'gpt-3.5-turbo'): Promise<{
    valid: boolean;
    model_available: boolean;
    error?: string;
  }> {
    try {
      const openai = new OpenAI({ apiKey });
      
      // Primero verificar que la API key funcione
      const modelsResponse = await openai.models.list();
      if (!modelsResponse || !modelsResponse.data) {
        return {
          valid: false,
          model_available: false,
          error: 'Invalid API key'
        };
      }

      // Verificar si el modelo está disponible
      const availableModels = modelsResponse.data.map(m => m.id);
      const modelAvailable = availableModels.includes(model);

      if (!modelAvailable) {
        return {
          valid: true,
          model_available: false,
          error: `Model ${model} not available. Available models: ${availableModels.slice(0, 5).join(', ')}`
        };
      }

      // Hacer una prueba simple con el modelo
      const testResponse = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'user', content: 'Test message - respond with "OK"' }
        ],
        max_tokens: 5,
        temperature: 0
      });

      const responseValid = testResponse && testResponse.choices && testResponse.choices.length > 0;

      return {
        valid: true,
        model_available: true,
        error: responseValid ? undefined : 'Model test failed'
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        valid: false,
        model_available: false,
        error: errorMessage
      };
    }
  }

  public async updateApiKey(userId: string, newApiKey: string): Promise<void> {
    try {
      // Validar formato
      if (!EncryptionService.validateApiKeyFormat(newApiKey)) {
        throw new AppError('Invalid API key format', 400);
      }

      // Validar que funcione
      const isValid = await this.validateApiKey(newApiKey);
      if (!isValid) {
        throw new AppError('Invalid or inactive API key', 400);
      }

      // Encriptar nueva API key
      const encryptedApiKey = EncryptionService.encrypt(newApiKey);

      // Actualizar en base de datos
      const config = await UserAiConfig.findOne({
        where: { userId }
      });

      if (!config) {
        throw new AppError('User AI configuration not found', 404);
      }

      await config.update({
        encrypted_api_key: encryptedApiKey,
        has_api_key: true,
        is_active: true
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update API key', 500);
    }
  }

  public async removeApiKey(userId: string): Promise<void> {
    try {
      const config = await UserAiConfig.findOne({
        where: { userId }
      });

      if (!config) {
        throw new AppError('User AI configuration not found', 404);
      }

      await config.update({
        encrypted_api_key: null,
        has_api_key: false,
        is_active: false,
        newsletter_enabled: false,
        chatbot_enabled: false
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove API key', 500);
    }
  }

  public getRecommendedModels(): { model: string; use_case: string; cost_per_1k_tokens: number }[] {
    return [
      {
        model: 'gpt-4o-mini',
        use_case: 'Newsletter conversion, general tasks',
        cost_per_1k_tokens: 0.00015
      },
      {
        model: 'gpt-3.5-turbo',
        use_case: 'Chatbot, quick responses',
        cost_per_1k_tokens: 0.002
      },
      {
        model: 'gpt-4o',
        use_case: 'Complex analysis, high quality content',
        cost_per_1k_tokens: 0.03
      },
      {
        model: 'gpt-4',
        use_case: 'Premium content, detailed analysis',
        cost_per_1k_tokens: 0.03
      }
    ];
  }
}

export default CreateUserAiConfigService;

