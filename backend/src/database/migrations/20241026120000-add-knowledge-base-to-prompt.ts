import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Prompts", "knowledgeBaseSites", {
      type: DataTypes.JSON,
      allowNull: true
    });

    await queryInterface.addColumn("Prompts", "knowledgeBaseFiles", {
      type: DataTypes.JSON,
      allowNull: true
    });

    await queryInterface.addColumn("Prompts", "knowledgeBaseContext", {
      // Long text for grandes blocos de contexto
      type: DataTypes.TEXT("long" as any),
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Prompts", "knowledgeBaseSites");
    await queryInterface.removeColumn("Prompts", "knowledgeBaseFiles");
    await queryInterface.removeColumn("Prompts", "knowledgeBaseContext");
  }
};
