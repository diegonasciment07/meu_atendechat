// ETAPA 1: Consultar estado atual do campo overage
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function consultarOverageAtual() {
  try {
    console.log('🔍 ETAPA 1 - Consultando estado atual do campo overage...');
    
    const planos = await sequelize.query(
      'SELECT id, name, price, overage FROM "Plans" ORDER BY id;',
      { type: QueryTypes.SELECT }
    );
    
    console.log('\n📋 ESTADO ATUAL DOS CAMPOS OVERAGE:');
    console.log('='.repeat(80));
    
    planos.forEach((plano, index) => {
      console.log(`\n🔸 ${plano.name.toUpperCase()} (ID: ${plano.id})`);
      console.log(`   💰 Preço: R$ ${plano.price}`);
      console.log(`   📊 Overage atual:`);
      console.log(`   ${JSON.stringify(plano.overage, null, 6)}`);
      
      // Verificar se add-ons já existem
      const hasExtraUser = plano.overage && plano.overage.extra_user !== undefined;
      const hasExtraWhatsapp = plano.overage && plano.overage.extra_whatsapp_instance !== undefined;
      
      console.log(`   🔍 extra_user: ${hasExtraUser ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
      console.log(`   🔍 extra_whatsapp_instance: ${hasExtraWhatsapp ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
      console.log('-'.repeat(50));
    });
    
    console.log(`\n📊 Total de planos encontrados: ${planos.length}`);
    console.log('✅ Consulta concluída - nenhuma alteração aplicada');
    
  } catch (error) {
    console.error('❌ Erro ao consultar overage:', error.message);
  } finally {
    await sequelize.close();
  }
}

consultarOverageAtual();