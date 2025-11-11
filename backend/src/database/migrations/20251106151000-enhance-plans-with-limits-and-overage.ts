import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar estrutura atual da tabela Plans
      const plansTableDescription = await queryInterface.describeTable("Plans");
      const desc = plansTableDescription as any;
      
      // Adicionar coluna price se não existir (renomear value para price)
      if (desc.value && !desc.price) {
        await queryInterface.renameColumn("Plans", "value", "price", { transaction });
      } else if (!desc.price) {
        await queryInterface.addColumn("Plans", "price", {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        }, { transaction });
      }
      
      // Adicionar coluna limits se não existir
      if (!desc.limits) {
        await queryInterface.addColumn("Plans", "limits", {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        }, { transaction });
      }
      
      // Adicionar coluna overage se não existir
      if (!desc.overage) {
        await queryInterface.addColumn("Plans", "overage", {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        }, { transaction });
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
      // Verificar estrutura da tabela
      const plansTableDescription = await queryInterface.describeTable("Plans");
      const desc = plansTableDescription as any;
      
      // Remover colunas adicionadas
      if (desc.overage) {
        await queryInterface.removeColumn("Plans", "overage", { transaction });
      }
      
      if (desc.limits) {
        await queryInterface.removeColumn("Plans", "limits", { transaction });
      }
      
      // Reverter price para value se necessário
      if (desc.price && !desc.value) {
        await queryInterface.renameColumn("Plans", "price", "value", { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};