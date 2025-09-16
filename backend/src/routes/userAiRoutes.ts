import { Router } from "express";
import UserAiConfigController from "../controllers/UserAiConfigController";
import isAuth from "../middleware/isAuth";
import { body, query, param } from "express-validator";
import { handleValidationErrors } from "../middleware/handleValidationErrors";

const userAiRoutes = Router();
const userAiConfigController = new UserAiConfigController();

userAiRoutes.get("/test", (req, res) => {
  res.json({ success: true, message: "AI routes working!", timestamp: new Date() });
});

// Middleware de validación personalizado para este módulo
const validateApiKey = [
  body('api_key')
    .isString()
    .isLength({ min: 20, max: 200 })
    .withMessage('API key must be a string between 20 and 200 characters')
    .matches(/^sk-[a-zA-Z0-9]+$/)
    .withMessage('API key must be a valid OpenAI format (starts with sk-)'),
];

const validateNewsletterConversion = [
  body('content')
    .isString()
    .isLength({ min: 50, max: 50000 })
    .withMessage('Content must be between 50 and 50,000 characters'),
  body('content_type')
    .optional()
    .isIn(['text', 'html', 'url'])
    .withMessage('Content type must be text, html, or url'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'commercial', 'informative'])
    .withMessage('Tone must be professional, casual, commercial, or informative'),
  body('message_count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Message count must be between 1 and 10'),
  body('max_chars_per_message')
    .optional()
    .isInt({ min: 50, max: 1000 })
    .withMessage('Max characters per message must be between 50 and 1000'),
];

const validateSettings = [
  body('newsletter_enabled')
    .optional()
    .isBoolean()
    .withMessage('Newsletter enabled must be a boolean'),
  body('chatbot_enabled')
    .optional()
    .isBoolean()
    .withMessage('Chatbot enabled must be a boolean'),
  body('daily_limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Daily limit must be between 1 and 1000'),
  body('preferred_model')
    .optional()
    .isString()
    .isIn(['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4'])
    .withMessage('Preferred model must be a valid OpenAI model'),
];

const validatePeriodQuery = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Period must be day, week, or month'),
];

const validateLimitQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Rutas principales de configuración
userAiRoutes.get(
  "/config",
  isAuth,
  userAiConfigController.getConfig
);

userAiRoutes.post(
  "/config",
  isAuth,
  validateApiKey,
  validateSettings,
  handleValidationErrors,
  userAiConfigController.saveConfig
);

userAiRoutes.put(
  "/config/settings",
  isAuth,
  validateSettings,
  handleValidationErrors,
  userAiConfigController.updateSettings
);

userAiRoutes.delete(
  "/config",
  isAuth,
  userAiConfigController.deleteConfig
);

// Rutas de gestión de API key
userAiRoutes.post(
  "/config/test-api-key",
  isAuth,
  [
    body('api_key')
      .isString()
      .notEmpty()
      .withMessage('API key is required'),
    body('model')
      .optional()
      .isString()
      .withMessage('Model must be a string'),
  ],
  handleValidationErrors,
  userAiConfigController.testApiKey
);

userAiRoutes.put(
  "/config/api-key",
  isAuth,
  validateApiKey,
  handleValidationErrors,
  userAiConfigController.updateApiKey
);

// Rutas de funcionalidades de IA
userAiRoutes.post(
  "/newsletter/convert",
  isAuth,
  validateNewsletterConversion,
  handleValidationErrors,
  userAiConfigController.convertNewsletter
);

// Rutas de estadísticas y límites
userAiRoutes.get(
  "/stats/usage",
  isAuth,
  validatePeriodQuery,
  handleValidationErrors,
  userAiConfigController.getUsageStats
);

userAiRoutes.get(
  "/stats/daily-limit",
  isAuth,
  userAiConfigController.getDailyLimit
);

// Rutas de información
userAiRoutes.get(
  "/models/available",
  isAuth,
  userAiConfigController.getAvailableModels
);

// Rutas de administración (requieren permisos especiales)
userAiRoutes.get(
  "/admin/stats/system",
  isAuth,
  validatePeriodQuery,
  handleValidationErrors,
  userAiConfigController.getSystemStats
);

userAiRoutes.get(
  "/admin/stats/top-users",
  isAuth,
  validatePeriodQuery,
  validateLimitQuery,
  handleValidationErrors,
  userAiConfigController.getTopUsers
);

// Middleware de manejo de errores específico para este módulo
userAiRoutes.use((error: any, req: any, res: any, next: any) => {
  console.error('UserAI Routes Error:', error);
  
  // Si ya se envió una respuesta, no hacer nada
  if (res.headersSent) {
    return next(error);
  }

  // Manejar errores específicos de OpenAI
  if (error.code === 'insufficient_quota') {
    return res.status(402).json({
      success: false,
      error: 'OpenAI API quota exceeded. Please check your OpenAI account.'
    });
  }

  if (error.code === 'invalid_api_key') {
    return res.status(401).json({
      success: false,
      error: 'Invalid OpenAI API key. Please update your configuration.'
    });
  }

  if (error.code === 'model_not_found') {
    return res.status(400).json({
      success: false,
      error: 'The specified AI model is not available.'
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    error: 'Internal server error in AI module'
  });
});

export default userAiRoutes;

