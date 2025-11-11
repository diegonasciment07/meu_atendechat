import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement
} from "sequelize-typescript";

@Table({ tableName: "usage_counters" })
class UsageCounter extends Model<UsageCounter> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: string;

  @Column(DataType.INTEGER)
  company_id: number;

  @Column(DataType.STRING)
  key: string;

  @Column(DataType.INTEGER)
  value: number;

  @Column(DataType.DATE)
  period_start: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default UsageCounter;