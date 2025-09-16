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

interface UserAiConfigAttributes {
  id?: number;
  userId: number;
  encrypted_api_key?: string | null;
  has_api_key?: boolean;
  newsletter_enabled?: boolean;
  chatbot_enabled?: boolean;
  daily_limit?: number;
  usage_count?: number;
  last_reset_date?: Date | null;
  total_cost?: number;
  total_tokens?: number;
  preferred_model?: string;
  is_active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserAiConfigCreationAttributes extends Omit<UserAiConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
  tableName: 'user_ai_configs',
  timestamps: true
})
class UserAiConfig extends Model<UserAiConfigAttributes, UserAiConfigCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare userId: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare encrypted_api_key: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare has_api_key: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare newsletter_enabled: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare chatbot_enabled: boolean;

  @Default(50)
  @Column(DataType.INTEGER)
  declare daily_limit: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare usage_count: number;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  declare last_reset_date: Date | null;

  @Default(0)
  @Column(DataType.DECIMAL(10, 4))
  declare total_cost: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare total_tokens: number;

  @Default('gpt-4o-mini')
  @Column(DataType.STRING(50))
  declare preferred_model: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => User)
  declare user: User;

  // Métodos de instancia
  public isWithinDailyLimit(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = this.last_reset_date?.toISOString().split('T')[0];
    
    if (lastReset !== today) {
      return true; // Nuevo día, límite reseteado
    }
    
    return this.usage_count < this.daily_limit;
  }

  public async resetDailyUsage(): Promise<void> {
    const today = new Date();
    await this.update({
      usage_count: 0,
      last_reset_date: today
    });
  }

  public async incrementUsage(tokens: number = 0, cost: number = 0): Promise<void> {
    await this.update({
      usage_count: this.usage_count + 1,
      total_tokens: this.total_tokens + tokens,
      total_cost: this.total_cost + cost
    });
  }
}

export default UserAiConfig;
export { UserAiConfigAttributes, UserAiConfigCreationAttributes };

