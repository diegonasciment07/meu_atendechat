const { Sequelize } = require('sequelize');
require('dotenv').config();

async function createPlansManually() {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    try {
        console.log('🚀 CRIANDO PLANOS OFICIAIS NO SUPABASE...');
        
        // Limpar planos existentes
        await sequelize.query('DELETE FROM "Plans";');
        console.log('🗑️ Planos anteriores removidos');
        
        // Inserir os 3 planos oficiais
        const plans = [
            {
                id: 1,
                name: 'STARTER',
                users: 3,
                connections: 1,
                queues: 1,
                value: 297.00,
                useCampaigns: true,
                useExternalApi: true,
                useInternalChat: true,
                useSchedules: true,
                useKanban: true,
                useIntegrations: true,
                useOpenAi: false
            },
            {
                id: 2,
                name: 'PRO',
                users: 10,
                connections: 3,
                queues: 3,
                value: 697.00,
                useCampaigns: true,
                useExternalApi: true,
                useInternalChat: true,
                useSchedules: true,
                useKanban: true,
                useIntegrations: true,
                useOpenAi: true
            },
            {
                id: 3,
                name: 'ENTERPRISE',
                users: 25,
                connections: 10,
                queues: 10,
                value: 1497.00,
                useCampaigns: true,
                useExternalApi: true,
                useInternalChat: true,
                useSchedules: true,
                useKanban: true,
                useIntegrations: true,
                useOpenAi: true
            }
        ];

        for (const plan of plans) {
            await sequelize.query(
                `INSERT INTO "Plans" (id, name, users, connections, queues, value, "useCampaigns", "useExternalApi", "useInternalChat", "useSchedules", "useKanban", "useIntegrations", "useOpenAi", "createdAt", "updatedAt") 
                 VALUES (:id, :name, :users, :connections, :queues, :value, :useCampaigns, :useExternalApi, :useInternalChat, :useSchedules, :useKanban, :useIntegrations, :useOpenAi, NOW(), NOW())`,
                {
                    replacements: plan,
                    type: sequelize.QueryTypes.INSERT
                }
            );
            console.log(`✅ Plano ${plan.name} criado (ID: ${plan.id}, Valor: R$ ${plan.value})`);
        }
        
        // Verificar resultado
        const createdPlans = await sequelize.query(
            'SELECT id, name, users, connections, value FROM "Plans" ORDER BY id;',
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('\n📋 RESUMO DOS PLANOS CRIADOS:');
        createdPlans.forEach(plan => {
            console.log(`- ${plan.name}: ${plan.users} usuários, ${plan.connections} WhatsApp, R$ ${plan.value}`);
        });
        
        console.log('\n✅ PLANOS CRIADOS COM SUCESSO NO SUPABASE!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await sequelize.close();
    }
}

createPlansManually();