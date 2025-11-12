const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function queryCurrentPlansState() {
    console.log('🔍 CONSULTANDO ESTADO ATUAL DA TABELA PLANS...');
    
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
        // Consultar todos os campos da tabela Plans
        const plans = await sequelize.query(
            `SELECT 
                id, 
                name, 
                users, 
                connections, 
                queues, 
                value,
                "useCampaigns",
                "useExternalApi",
                "useInternalChat", 
                "useSchedules",
                "useKanban",
                "useIntegrations",
                "useOpenAi",
                "createdAt",
                "updatedAt"
             FROM "Plans" 
             ORDER BY id`,
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log(`📋 Encontrados ${plans.length} planos na tabela`);
        
        // Gerar relatório detalhado
        let report = `# 📋 PLANS BEFORE NORMALIZATION\n\n`;
        report += `**Data da Consulta**: ${new Date().toLocaleString('pt-BR')}\n`;
        report += `**Banco**: Supabase PostgreSQL (cgnjnxkoybrmtinvluus.supabase.co)\n`;
        report += `**Total de Registros**: ${plans.length}\n\n`;
        report += `---\n\n`;

        plans.forEach((plan, index) => {
            report += `## ${index + 1}. ${plan.name} (ID: ${plan.id})\n\n`;
            report += `- **Price/Value**: R$ ${plan.value}\n`;
            report += `- **Users**: ${plan.users}\n`;
            report += `- **Connections**: ${plan.connections}\n`;
            report += `- **Queues**: ${plan.queues}\n`;
            report += `- **Features**:\n`;
            report += `  - Campaigns: ${plan.useCampaigns ? '✅' : '❌'}\n`;
            report += `  - External API: ${plan.useExternalApi ? '✅' : '❌'}\n`;
            report += `  - Internal Chat: ${plan.useInternalChat ? '✅' : '❌'}\n`;
            report += `  - Schedules: ${plan.useSchedules ? '✅' : '❌'}\n`;
            report += `  - Kanban: ${plan.useKanban ? '✅' : '❌'}\n`;
            report += `  - Integrations: ${plan.useIntegrations ? '✅' : '❌'}\n`;
            report += `  - OpenAI: ${plan.useOpenAi ? '✅' : '❌'}\n`;
            report += `- **Created**: ${new Date(plan.createdAt).toLocaleString('pt-BR')}\n`;
            report += `- **Updated**: ${new Date(plan.updatedAt).toLocaleString('pt-BR')}\n\n`;
            report += `---\n\n`;
        });

        report += `## 📊 Resumo Estrutural\n\n`;
        report += `| Plano | ID | Preço | Usuários | WhatsApp | OpenAI |\n`;
        report += `|-------|----|----- -|----------|----------|--------|\n`;
        
        plans.forEach(plan => {
            report += `| ${plan.name} | ${plan.id} | R$ ${plan.value} | ${plan.users} | ${plan.connections} | ${plan.useOpenAi ? '✅' : '❌'} |\n`;
        });

        report += `\n---\n\n`;
        report += `**Status**: Estado capturado antes da normalização\n`;
        report += `**Próximo Passo**: Aplicar novos limites e estrutura JSONB\n`;

        // Salvar o relatório
        const fs = require('fs');
        fs.writeFileSync(path.join(__dirname, 'plans_before_normalization.md'), report);
        
        console.log('✅ Relatório salvo em: plans_before_normalization.md');
        console.log('\n📊 RESUMO DOS PLANOS ATUAIS:');
        plans.forEach(plan => {
            console.log(`   - ${plan.name}: ${plan.users} usuários, ${plan.connections} WhatsApp, R$ ${plan.value}`);
        });

        return plans;

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

queryCurrentPlansState().catch(console.error);