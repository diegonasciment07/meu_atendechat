// ETAPA 2: Adicionar add-ons extra_user e extra_whatsapp_instance
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function adicionarAddOns() {
  try {
    console.log('🔄 ETAPA 2 - Adicionando add-ons aos campos overage...');
    
    console.log('\n📝 Executando UPDATE SQL:');
    console.log('UPDATE "Plans"');
    console.log('SET overage = jsonb_set(');
    console.log('    jsonb_set(');
    console.log('        overage,');
    console.log("        '{extra_user}', '19.9'::jsonb,");
    console.log('        true');
    console.log('    ),');
    console.log("    '{extra_whatsapp_instance}', '49.9'::jsonb,");
    console.log('    true');
    console.log(')');
    console.log("WHERE name IN ('Starter', 'Pro', 'Enterprise');");
    
    console.log('\n🔄 Aplicando atualização...');
    
    const result = await sequelize.query(`
      UPDATE "Plans"
      SET overage = jsonb_set(
          jsonb_set(
              overage,
              '{extra_user}', '19.9'::jsonb,
              true
          ),
          '{extra_whatsapp_instance}', '49.9'::jsonb,
          true
      )
      WHERE name IN ('Starter', 'Pro', 'Enterprise');
    `);
    
    console.log('✅ Atualização executada com sucesso');
    console.log(`📊 Registros afetados: ${result[1].rowCount || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Erro durante atualização:', error.message);
  } finally {
    await sequelize.close();
  }
}

adicionarAddOns();