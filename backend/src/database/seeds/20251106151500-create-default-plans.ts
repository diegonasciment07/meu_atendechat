import { QueryInterface, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const plans = [
      {
        name: "Starter",
        price: 297,
        limits: {
          users: 2,
          whatsapp_instances: 1,
          flows: 2,
          webhooks: 0,
          history_days: 30,
          conversations: 1000,
          ai_requests_included: 0,
          support_sla: "business_hours"
        },
        overage: {
          conversation_price: 1.20,
          ai_request_price: null
        },
        // Mantém campos existentes para compatibilidade
        users: 2,
        connections: 1,
        queues: 3,
        useSchedules: true,
        useCampaigns: true,
        useInternalChat: false,
        useExternalApi: false,
        useKanban: false,
        useOpenAi: false,
        useIntegrations: false
      },
      {
        name: "Pro",
        price: 697,
        limits: {
          users: 8,
          whatsapp_instances: 2,
          flows: 5,
          webhooks: 5,
          history_days: 180,
          conversations: 5000,
          ai_requests_included: 300,
          support_sla: "24x7"
        },
        overage: {
          conversation_price: 1.20,
          ai_request_price: 0.29
        },
        // Mantém campos existentes para compatibilidade
        users: 8,
        connections: 2,
        queues: 10,
        useSchedules: true,
        useCampaigns: true,
        useInternalChat: true,
        useExternalApi: true,
        useKanban: true,
        useOpenAi: true,
        useIntegrations: true
      },
      {
        name: "Enterprise",
        price: 1497,
        limits: {
          users: 20,
          whatsapp_instances: 3,
          flows: 15,
          webhooks: 10,
          history_days: 365,
          conversations: 10000,
          ai_requests_included: 1500,
          support_sla: "24x7"
        },
        overage: {
          conversation_price: 1.20,
          ai_request_price: 0.19
        },
        // Mantém campos existentes para compatibilidade
        users: 20,
        connections: 3,
        queues: 999,
        useSchedules: true,
        useCampaigns: true,
        useInternalChat: true,
        useExternalApi: true,
        useKanban: true,
        useOpenAi: true,
        useIntegrations: true
      }
    ];

    for (const plan of plans) {
      // Verificar se o plano já existe
      const [existingPlan] = await queryInterface.sequelize.query(
        `SELECT id FROM "Plans" WHERE name = :name`,
        {
          replacements: { name: plan.name },
          type: QueryTypes.SELECT
        }
      );

      const planData = {
        ...plan,
        limits: JSON.stringify(plan.limits),
        overage: JSON.stringify(plan.overage)
      };

      if (existingPlan) {
        // Atualizar plano existente
        await queryInterface.sequelize.query(
          `UPDATE "Plans" SET 
             price = :price,
             limits = :limits,
             overage = :overage,
             users = :users,
             connections = :connections,
             queues = :queues,
             "useSchedules" = :useSchedules,
             "useCampaigns" = :useCampaigns,
             "useInternalChat" = :useInternalChat,
             "useExternalApi" = :useExternalApi,
             "useKanban" = :useKanban,
             "useOpenAi" = :useOpenAi,
             "useIntegrations" = :useIntegrations,
             "updatedAt" = NOW()
           WHERE name = :name`,
          {
            replacements: {
              name: plan.name,
              price: plan.price,
              limits: planData.limits,
              overage: planData.overage,
              users: plan.users,
              connections: plan.connections,
              queues: plan.queues,
              useSchedules: plan.useSchedules,
              useCampaigns: plan.useCampaigns,
              useInternalChat: plan.useInternalChat,
              useExternalApi: plan.useExternalApi,
              useKanban: plan.useKanban,
              useOpenAi: plan.useOpenAi,
              useIntegrations: plan.useIntegrations
            }
          }
        );
      } else {
        // Criar novo plano
        await queryInterface.sequelize.query(
          `INSERT INTO "Plans" (
             name, price, limits, overage, users, connections, queues,
             "useSchedules", "useCampaigns", "useInternalChat", "useExternalApi",
             "useKanban", "useOpenAi", "useIntegrations", "createdAt", "updatedAt"
           ) VALUES (
             :name, :price, :limits, :overage, :users, :connections, :queues,
             :useSchedules, :useCampaigns, :useInternalChat, :useExternalApi,
             :useKanban, :useOpenAi, :useIntegrations, NOW(), NOW()
           )`,
          {
            replacements: {
              name: plan.name,
              price: plan.price,
              limits: planData.limits,
              overage: planData.overage,
              users: plan.users,
              connections: plan.connections,
              queues: plan.queues,
              useSchedules: plan.useSchedules,
              useCampaigns: plan.useCampaigns,
              useInternalChat: plan.useInternalChat,
              useExternalApi: plan.useExternalApi,
              useKanban: plan.useKanban,
              useOpenAi: plan.useOpenAi,
              useIntegrations: plan.useIntegrations
            }
          }
        );
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Remover apenas os planos que criamos
    return queryInterface.bulkDelete("Plans", {
      name: ["Starter", "Pro", "Enterprise"]
    });
  }
};