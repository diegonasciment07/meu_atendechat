const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function queryPlansAfterNormalization() {
    console.log('📊 CONSULTANDO ESTADO FINAL DA TABELA PLANS...');
    
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
        // Consultar todos os campos da tabela Plans incluindo os novos JSONB
        const plans = await sequelize.query(
            `SELECT 
                id, 
                name, 
                users, 
                connections, 
                queues, 
                value,
                limits,
                overage,
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

        console.log(`📋 ${plans.length} planos normalizados encontrados`);
        
        // Gerar relatório detalhado pós-normalização
        let report = `# 📊 PLANS AFTER NORMALIZATION\n\n`;
        report += `**Data da Consulta**: ${new Date().toLocaleString('pt-BR')}\n`;
        report += `**Banco**: Supabase PostgreSQL (cgnjnxkoybrmtinvluus.supabase.co)\n`;
        report += `**Total de Registros**: ${plans.length}\n`;
        report += `**Status**: Planos normalizados com limites e overages JSONB\n\n`;
        report += `---\n\n`;

        plans.forEach((plan, index) => {
            report += `## ${index + 1}. ${plan.name} (ID: ${plan.id})\n\n`;
            report += `### 💰 Financeiro\n`;
            report += `- **Preço**: R$ ${plan.value}\n\n`;
            
            report += `### 👥 Limites Básicos\n`;
            report += `- **Usuários**: ${plan.users}\n`;
            report += `- **Instâncias WhatsApp**: ${plan.connections}\n`;
            report += `- **Filas**: ${plan.queues}\n\n`;

            if (plan.limits) {
                const limits = plan.limits;
                report += `### 🎯 Limites JSONB\n`;
                report += `\`\`\`json\n${JSON.stringify(limits, null, 2)}\n\`\`\`\n\n`;
                
                report += `**Resumo dos Limites**:\n`;
                report += `- Usuários: ${limits.users}\n`;
                report += `- WhatsApp: ${limits.whatsapp_instances}\n`;
                report += `- Automações: ${limits.automations}\n`;
                report += `- Webhooks: ${limits.webhooks}\n`;
                report += `- IA Requests: ${limits.ai_requests_included}\n`;
                report += `- IA Habilitado: ${limits.ai_enabled ? '✅' : '❌'}\n`;
                report += `- Retenção: ${limits.data_retention_days} dias\n\n`;
            }

            if (plan.overage) {
                const overage = plan.overage;
                report += `### 💸 Overage JSONB\n`;
                report += `\`\`\`json\n${JSON.stringify(overage, null, 2)}\n\`\`\`\n\n`;
                
                report += `**Preços de Overage**:\n`;
                report += `- IA Requests: ${overage.ai_requests ? `R$ ${overage.ai_requests}` : 'N/A'}\n`;
                report += `- Usuário Extra: R$ ${overage.extra_user}\n`;
                report += `- WhatsApp Extra: R$ ${overage.extra_whatsapp_instance}\n\n`;
            }

            report += `### ⚙️ Features\n`;
            report += `- Campaigns: ${plan.useCampaigns ? '✅' : '❌'}\n`;
            report += `- External API: ${plan.useExternalApi ? '✅' : '❌'}\n`;
            report += `- Internal Chat: ${plan.useInternalChat ? '✅' : '❌'}\n`;
            report += `- Schedules: ${plan.useSchedules ? '✅' : '❌'}\n`;
            report += `- Kanban: ${plan.useKanban ? '✅' : '❌'}\n`;
            report += `- Integrations: ${plan.useIntegrations ? '✅' : '❌'}\n`;
            report += `- OpenAI: ${plan.useOpenAi ? '✅' : '❌'}\n\n`;

            report += `### 🕒 Timestamps\n`;
            report += `- **Criado**: ${new Date(plan.createdAt).toLocaleString('pt-BR')}\n`;
            report += `- **Atualizado**: ${new Date(plan.updatedAt).toLocaleString('pt-BR')}\n\n`;
            report += `---\n\n`;
        });

        report += `## 📊 Tabela Comparativa Final\n\n`;
        report += `| Plano | Preço | Usuários | WhatsApp | Automações | Webhooks | IA Requests | Retenção | OpenAI |\n`;
        report += `|-------|-------|----------|----------|------------|----------|-------------|----------|--------|\n`;
        
        plans.forEach(plan => {
            const limits = plan.limits || {};
            report += `| ${plan.name} | R$ ${plan.value} | ${plan.users} | ${plan.connections} | ${limits.automations || 'N/A'} | ${limits.webhooks || 'N/A'} | ${limits.ai_requests_included || 'N/A'} | ${limits.data_retention_days || 'N/A'} dias | ${plan.useOpenAi ? '✅' : '❌'} |\n`;
        });

        report += `\n## 💸 Tabela de Overages\n\n`;
        report += `| Plano | IA Request | Usuário Extra | WhatsApp Extra |\n`;
        report += `|-------|------------|---------------|----------------|\n`;
        
        plans.forEach(plan => {
            const overage = plan.overage || {};
            report += `| ${plan.name} | ${overage.ai_requests ? `R$ ${overage.ai_requests}` : 'N/A'} | R$ ${overage.extra_user} | R$ ${overage.extra_whatsapp_instance} |\n`;
        });

        report += `\n---\n\n`;
        report += `**✅ Status**: Normalização concluída com sucesso\n`;
        report += `**🎯 Estrutura**: Limites e overages em formato JSONB\n`;
        report += `**📈 Compatibilidade**: planLimitGuard + UsageCounter ready\n`;

        // Salvar o relatório
        const fs = require('fs');
        fs.writeFileSync(path.join(__dirname, 'plans_after_normalization.md'), report);
        
        console.log('✅ Relatório pós-normalização salvo em: plans_after_normalization.md');
        
        return plans;

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

queryPlansAfterNormalization().catch(console.error);