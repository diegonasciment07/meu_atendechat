const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function normalizePlans() {
    console.log('🔧 NORMALIZANDO PLANOS COM LIMITES CORRETOS...');
    
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });

    try {
        // Primeiro, verificar se as colunas limits e overage existem
        console.log('🔍 Verificando estrutura da tabela...');
        
        const tableStructure = await sequelize.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'Plans' 
             AND column_name IN ('limits', 'overage')
             ORDER BY column_name`,
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log('📋 Colunas JSONB encontradas:', tableStructure);

        // Se as colunas não existirem, vamos criá-las
        if (tableStructure.length === 0) {
            console.log('⚠️ Colunas limits e overage não existem. Criando...');
            
            await sequelize.query('ALTER TABLE "Plans" ADD COLUMN IF NOT EXISTS limits JSONB');
            await sequelize.query('ALTER TABLE "Plans" ADD COLUMN IF NOT EXISTS overage JSONB');
            
            console.log('✅ Colunas limits e overage criadas');
        }

        // Definir os três planos normalizados
        const normalizedPlans = [
            {
                name: 'STARTER',
                price: 297,
                users: 2,
                connections: 1,
                limits: {
                    users: 2,
                    whatsapp_instances: 1,
                    automations: 2,
                    webhooks: 0,
                    ai_requests_included: 0,
                    ai_enabled: false,
                    data_retention_days: 30
                },
                overage: {
                    ai_requests: null,
                    extra_user: 19.9,
                    extra_whatsapp_instance: 49.9
                },
                useOpenAi: false
            },
            {
                name: 'PRO',
                price: 697,
                users: 5,
                connections: 2,
                limits: {
                    users: 5,
                    whatsapp_instances: 2,
                    automations: 5,
                    webhooks: 3,
                    ai_requests_included: 300,
                    ai_enabled: true,
                    data_retention_days: 90
                },
                overage: {
                    ai_requests: 0.29,
                    extra_user: 19.9,
                    extra_whatsapp_instance: 49.9
                },
                useOpenAi: true
            },
            {
                name: 'ENTERPRISE',
                price: 1497,
                users: 10,
                connections: 5,
                limits: {
                    users: 10,
                    whatsapp_instances: 5,
                    automations: 10,
                    webhooks: 10,
                    ai_requests_included: 1500,
                    ai_enabled: true,
                    data_retention_days: 365
                },
                overage: {
                    ai_requests: 0.19,
                    extra_user: 19.9,
                    extra_whatsapp_instance: 49.9
                },
                useOpenAi: true
            }
        ];

        console.log('\n🔄 Atualizando planos...');

        for (const plan of normalizedPlans) {
            console.log(`   Processando: ${plan.name}`);
            
            await sequelize.query(
                `INSERT INTO "Plans" (name, value, users, connections, queues, limits, overage, "useOpenAi", "useCampaigns", "useExternalApi", "useInternalChat", "useSchedules", "useKanban", "useIntegrations", "createdAt", "updatedAt")
                 VALUES (:name, :price, :users, :connections, 1, :limits::jsonb, :overage::jsonb, :useOpenAi, true, true, true, true, true, true, NOW(), NOW())
                 ON CONFLICT (name) 
                 DO UPDATE SET
                    value = EXCLUDED.value,
                    users = EXCLUDED.users,
                    connections = EXCLUDED.connections,
                    limits = EXCLUDED.limits,
                    overage = EXCLUDED.overage,
                    "useOpenAi" = EXCLUDED."useOpenAi",
                    "updatedAt" = NOW()`,
                {
                    replacements: {
                        name: plan.name,
                        price: plan.price,
                        users: plan.users,
                        connections: plan.connections,
                        limits: JSON.stringify(plan.limits),
                        overage: JSON.stringify(plan.overage),
                        useOpenAi: plan.useOpenAi
                    },
                    type: sequelize.QueryTypes.INSERT
                }
            );
            
            console.log(`   ✅ ${plan.name} atualizado`);
        }

        console.log('\n✅ Todos os planos normalizados com sucesso!');
        
        // Verificar resultado
        const updatedPlans = await sequelize.query(
            'SELECT id, name, value, users, connections, limits, overage, "useOpenAi" FROM "Plans" ORDER BY id',
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log('\n📊 PLANOS ATUALIZADOS:');
        updatedPlans.forEach(plan => {
            console.log(`   - ${plan.name}: ${plan.users} usuários, ${plan.connections} WhatsApp, R$ ${plan.value}, OpenAI: ${plan.useOpenAi ? '✅' : '❌'}`);
        });

        return updatedPlans;

    } catch (error) {
        console.error('❌ Erro na normalização:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

normalizePlans().catch(console.error);