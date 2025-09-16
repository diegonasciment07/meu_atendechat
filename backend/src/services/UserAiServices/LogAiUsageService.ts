import AiUsageLog from '../../models/AiUsageLog';
import GetUserAiConfigService from './GetUserAiConfigService';
import AppError from '../../errors/AppError';

interface LogAiUsageData {
  userId: string;
  feature: 'newsletter' | 'chatbot' | 'other';
  model_used: string;
  tokens_used: number;
  estimated_cost: number;
  request_data?: object;
  response_data?: object;
  success: boolean;
  error_message?: string;
  execution_time?: number;
}

interface DailyLimitCheck {
  canUse: boolean;
  current_usage: number;
  limit: number;
  remaining: number;
}

interface UsageStats {
  daily: {
    usage_count: number;
    total_tokens: number;
    total_cost: number;
    by_feature: { [key: string]: any };
  };
  weekly: {
    usage_count: number;
    total_tokens: number;
    total_cost: number;
    by_feature: { [key: string]: any };
  };
  monthly: {
    usage_count: number;
    total_tokens: number;
    total_cost: number;
    by_feature: { [key: string]: any };
  };
}

class LogAiUsageService {
  private getUserAiConfigService: GetUserAiConfigService;

  constructor() {
    this.getUserAiConfigService = new GetUserAiConfigService();
  }

  public async execute(data: LogAiUsageData): Promise<void> {
    try {
      const startTime = Date.now();

      // Registrar el uso en la tabla de logs
      await AiUsageLog.create({
        userId: data.userId,
        feature: data.feature,
        model_used: data.model_used,
        tokens_used: data.tokens_used,
        estimated_cost: data.estimated_cost,
        request_data: data.request_data || null,
        response_data: data.response_data || null,
        success: data.success,
        error_message: data.error_message || null,
        execution_time: data.execution_time || (Date.now() - startTime)
      });

      // Si fue exitoso, actualizar contadores en la configuración del usuario
      if (data.success) {
        await this.getUserAiConfigService.incrementUsage(
          data.userId,
          data.tokens_used,
          data.estimated_cost
        );
      }
    } catch (error) {
      // Log del error pero no fallar el proceso principal
      console.error('Failed to log AI usage:', error);
    }
  }

  public async checkDailyLimit(userId: string): Promise<DailyLimitCheck> {
    try {
      const config = await this.getUserAiConfigService.execute(userId);
      
      return {
        canUse: config.usage_count < config.daily_limit,
        current_usage: config.usage_count,
        limit: config.daily_limit,
        remaining: Math.max(0, config.daily_limit - config.usage_count)
      };
    } catch (error) {
      throw new AppError('Failed to check daily limit', 500);
    }
  }

  public async getUsageStats(userId: string, period: string = 'week'): Promise<UsageStats> {
    try {
      const now = new Date();
      
      // Calcular fechas para cada período
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);

      // Obtener estadísticas por período
      const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
        this.getStatsForPeriod(userId, dayStart, now),
        this.getStatsForPeriod(userId, weekStart, now),
        this.getStatsForPeriod(userId, monthStart, now)
      ]);

      return {
        daily: dailyStats,
        weekly: weeklyStats,
        monthly: monthlyStats
      };
    } catch (error) {
      throw new AppError('Failed to get usage statistics', 500);
    }
  }

  private async getStatsForPeriod(userId: string, startDate: Date, endDate: Date) {
    const { Op } = require('sequelize');
    
    // Estadísticas generales
    const generalStats = await AiUsageLog.findOne({
      where: {
        userId,
        success: true,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usage_count'],
        [require('sequelize').fn('SUM', require('sequelize').col('tokens_used')), 'total_tokens'],
        [require('sequelize').fn('SUM', require('sequelize').col('estimated_cost')), 'total_cost']
      ],
      raw: true
    });

    // Estadísticas por feature
    const featureStats = await AiUsageLog.findAll({
      where: {
        userId,
        success: true,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'feature',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usage_count'],
        [require('sequelize').fn('SUM', require('sequelize').col('tokens_used')), 'total_tokens'],
        [require('sequelize').fn('SUM', require('sequelize').col('estimated_cost')), 'total_cost'],
        [require('sequelize').fn('AVG', require('sequelize').col('execution_time')), 'avg_execution_time']
      ],
      group: ['feature'],
      raw: true
    });

    // Formatear estadísticas por feature
    const by_feature = {};
    featureStats.forEach((stat: any) => {
      by_feature[stat.feature] = {
        usage_count: parseInt(stat.usage_count) || 0,
        total_tokens: parseInt(stat.total_tokens) || 0,
        total_cost: parseFloat(stat.total_cost) || 0,
        avg_execution_time: parseFloat(stat.avg_execution_time) || 0
      };
    });

    return {
      usage_count: parseInt((generalStats as any)?.usage_count) || 0,
      total_tokens: parseInt((generalStats as any)?.total_tokens) || 0,
      total_cost: parseFloat((generalStats as any)?.total_cost) || 0,

      by_feature
    };
  }

  public async getTopUsers(limit: number = 10, period: string = 'week') {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const { Op } = require('sequelize');

      const topUsers = await AiUsageLog.findAll({
        where: {
          success: true,
          createdAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'userId',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usage_count'],
          [require('sequelize').fn('SUM', require('sequelize').col('tokens_used')), 'total_tokens'],
          [require('sequelize').fn('SUM', require('sequelize').col('estimated_cost')), 'total_cost']
        ],
        group: ['userId'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
        limit,
        raw: true
      });

      return topUsers;
    } catch (error) {
      throw new AppError('Failed to get top users', 500);
    }
  }

  public async getSystemStats(period: string = 'week') {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const { Op } = require('sequelize');

      const stats = await AiUsageLog.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'feature',
          'model_used',
          'success',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usage_count'],
          [require('sequelize').fn('SUM', require('sequelize').col('tokens_used')), 'total_tokens'],
          [require('sequelize').fn('SUM', require('sequelize').col('estimated_cost')), 'total_cost']
        ],
        group: ['feature', 'model_used', 'success'],
        raw: true
      });

      return stats;
    } catch (error) {
      throw new AppError('Failed to get system statistics', 500);
    }
  }

  public async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { Op } = require('sequelize');

      const deletedCount = await AiUsageLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      return deletedCount;
    } catch (error) {
      throw new AppError('Failed to clean old logs', 500);
    }
  }
}

export default LogAiUsageService;

