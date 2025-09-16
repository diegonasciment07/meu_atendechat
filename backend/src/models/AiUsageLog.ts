import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull
} from "sequelize-typescript";
import User from "./User";

interface AiUsageLogAttributes {
  id?: number;
  userId: number;
  feature: 'newsletter' | 'chatbot' | 'other';
  model_used: string;
  tokens_used: number;
  estimated_cost: number;
  request_data?: object | null;
  response_data?: object | null;
  success: boolean;
  error_message?: string | null;
  execution_time?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AiUsageLogCreationAttributes extends Omit<AiUsageLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
  tableName: 'ai_usage_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['feature']
    },
    {
      fields: ['success']
    }
  ]
})
class AiUsageLog extends Model<AiUsageLogAttributes, AiUsageLogCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare userId: number;

  @Column(DataType.ENUM('newsletter', 'chatbot', 'other'))
  declare feature: 'newsletter' | 'chatbot' | 'other';

  @Column(DataType.STRING(50))
  declare model_used: string;

  @Default(0)
  @Column(DataType.INTEGER)
  declare tokens_used: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 6))
  declare estimated_cost: number;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare request_data: object | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare response_data: object | null;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare success: boolean;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare error_message: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare execution_time: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => User)
  declare user: User;

  // Métodos estáticos para estadísticas
  public static async getUserDailyUsage(userId: number, date?: Date): Promise<number> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.count({
      where: {
        userId,
        success: true,
        createdAt: {
          [require('sequelize').Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    return count;
  }

  public static async getUserUsageStats(userId: number, period: 'day' | 'week' | 'month' = 'week') {
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

    const stats = await this.findAll({
      where: {
        userId,
        createdAt: {
          [require('sequelize').Op.gte]: startDate
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

    return stats;
  }

  public static async getSystemStats(period: 'day' | 'week' | 'month' = 'week') {
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

    const stats = await this.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      attributes: [
        'feature',
        'model_used',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usage_count'],
        [require('sequelize').fn('SUM', require('sequelize').col('tokens_used')), 'total_tokens'],
        [require('sequelize').fn('SUM', require('sequelize').col('estimated_cost')), 'total_cost']
      ],
      group: ['feature', 'model_used'],
      raw: true
    });

    return stats;
  }
}

export default AiUsageLog;
export { AiUsageLogAttributes, AiUsageLogCreationAttributes };

