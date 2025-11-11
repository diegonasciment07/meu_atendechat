import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar se a coluna max_users já existe na tabela Plans
      const plansTableDescription = await queryInterface.describeTable("Plans");
      const desc = plansTableDescription as any;
      
      // Adicionar novas colunas à tabela Plans se não existirem
      if (!desc.max_users) {
        await queryInterface.addColumn("Plans", "max_users", {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }, { transaction });
      }
      
      if (!desc.max_appointments) {
        await queryInterface.addColumn("Plans", "max_appointments", {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }, { transaction });
      }
      
      if (!desc.max_whatsapp_agents) {
        await queryInterface.addColumn("Plans", "max_whatsapp_agents", {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }, { transaction });
      }

      // Verificar se a tabela usage_counters já existe
      const tables = await queryInterface.showAllTables();
      const usageCountersExists = tables.includes('UsageCounters') || tables.includes('usage_counters');
      
      if (!usageCountersExists) {
        // Criar tabela usage_counters
        await queryInterface.createTable("UsageCounters", {
          id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
          },
          company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: "Companies",
              key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          key: {
            type: DataTypes.STRING,
            allowNull: false
          },
          value: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          period_start: {
            type: DataTypes.DATEONLY,
            allowNull: false
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
          }
        }, { transaction });

        // Adicionar constraint única para (company_id, key, period_start)
        await queryInterface.addIndex(
          "UsageCounters",
          ["company_id", "key", "period_start"],
          { unique: true, name: "unique_company_key_period", transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remover colunas adicionadas à tabela Plans
      const plansTableDescription = await queryInterface.describeTable("Plans");
      const desc = plansTableDescription as any;
      
      if (desc.max_whatsapp_agents) {
        await queryInterface.removeColumn("Plans", "max_whatsapp_agents", { transaction });
      }
      
      if (desc.max_appointments) {
        await queryInterface.removeColumn("Plans", "max_appointments", { transaction });
      }
      
      if (desc.max_users) {
        await queryInterface.removeColumn("Plans", "max_users", { transaction });
      }

      // Verificar se a tabela usage_counters existe e removê-la
      const tables = await queryInterface.showAllTables();
      const usageCountersExists = tables.includes('UsageCounters') || tables.includes('usage_counters');
      
      if (usageCountersExists) {
        await queryInterface.dropTable("UsageCounters", { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};