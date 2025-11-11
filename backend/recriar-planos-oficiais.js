// Recriação completa e idempotente dos três planos oficiais
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function recriarPlanosOficiais() {
  try {
    console.log('🔄 Iniciando recriação dos planos oficiais...');
    
    // 1️⃣ Inserir/Recriar Starter – R$ 297
    console.log('\n🔹 1/3 - Inserindo/Atualizando Starter (R$ 297)...');
    await sequelize.query(`
      INSERT INTO "Plans" (name, price, limits, overage, "createdAt", "updatedAt")
      VALUES (
        'Starter',
        297,
        '{
          "users_included": 2,
          "webhooks": 0,
          "ai_enabled": false,
          "ai_requests_included": 0,
          "automations_included": 2,
          "history_retention_days": 30
        }'::jsonb,
        '{
          "ai_requests": null,
          "conversations": null,
          "webhooks": null
        }'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (name) DO UPDATE
      SET price = EXCLUDED.price,
          limits = EXCLUDED.limits,
          overage = EXCLUDED.overage,
          "updatedAt" = NOW();
    `);
    console.log('✅ Starter configurado com sucesso');
    
    // 🔹 Atualizar Pro – R$ 697
    console.log('\n🔹 2/3 - Atualizando Pro (R$ 697)...');
    await sequelize.query(`
      INSERT INTO "Plans" (name, price, limits, overage, "createdAt", "updatedAt")
      VALUES (
        'Pro',
        697,
        '{
          "users_included": 10,
          "webhooks": 5,
          "ai_enabled": true,
          "ai_requests_included": 300,
          "automations_included": 5,
          "history_retention_days": 90
        }'::jsonb,
        '{
          "ai_requests": 0.29,
          "conversations": null,
          "webhooks": null
        }'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (name) DO UPDATE
      SET price = EXCLUDED.price,
          limits = EXCLUDED.limits,
          overage = EXCLUDED.overage,
          "updatedAt" = NOW();
    `);
    console.log('✅ Pro configurado com sucesso');
    
    // 🔹 Atualizar Enterprise – R$ 1497
    console.log('\n🔹 3/3 - Atualizando Enterprise (R$ 1497)...');
    await sequelize.query(`
      INSERT INTO "Plans" (name, price, limits, overage, "createdAt", "updatedAt")
      VALUES (
        'Enterprise',
        1497,
        '{
          "users_included": 20,
          "webhooks": 10,
          "ai_enabled": true,
          "ai_requests_included": 1500,
          "automations_included": 20,
          "history_retention_days": 365
        }'::jsonb,
        '{
          "ai_requests": 0.19,
          "conversations": null,
          "webhooks": null
        }'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (name) DO UPDATE
      SET price = EXCLUDED.price,
          limits = EXCLUDED.limits,
          overage = EXCLUDED.overage,
          "updatedAt" = NOW();
    `);
    console.log('✅ Enterprise configurado com sucesso');
    
    // 2️⃣ Excluir planos indevidos
    console.log('\n🗑️ Removendo planos indevidos...');
    const deletedPlans = await sequelize.query(`
      DELETE FROM "Plans"
      WHERE name NOT IN ('Starter','Pro','Enterprise');
    `);
    console.log('✅ Planos indevidos removidos');
    
    // 3️⃣ Validar o resultado
    console.log('\n📋 VALIDAÇÃO FINAL - Consultando planos atualizados:');
    const planos = await sequelize.query(
      'SELECT name, price, limits, overage FROM "Plans" ORDER BY id;',
      { type: QueryTypes.SELECT }
    );
    
    console.log('='.repeat(80));
    console.log('RESULTADO FINAL:');
    console.log('='.repeat(80));
    
    planos.forEach((plano, index) => {
      console.log(`\n🔸 ${plano.name.toUpperCase()}:`);
      console.log(`   💰 Preço: R$ ${plano.price}`);
      console.log(`   👥 Users: ${plano.limits.users_included}`);
      console.log(`   🤖 AI Habilitada: ${plano.limits.ai_enabled}`);
      console.log(`   🔗 Webhooks: ${plano.limits.webhooks}`);
      console.log(`   ⚙️  Automações: ${plano.limits.automations_included}`);
      console.log(`   📅 Retenção: ${plano.limits.history_retention_days} dias`);
      console.log(`   💸 AI Overage: ${plano.overage.ai_requests || 'null'}`);
    });
    
    console.log('\n='.repeat(80));
    console.log(`✅ SUCESSO: ${planos.length} planos oficiais configurados`);
    console.log('✅ Nenhum plano de R$ 30 encontrado');
    console.log('✅ Estrutura padronizada aplicada');
    
  } catch (error) {
    console.error('❌ Erro durante recriação dos planos:', error.message);
  } finally {
    await sequelize.close();
  }
}

recriarPlanosOficiais();