// Consulta completa dos planos com limites e overage
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function consultarPlanosCompleto() {
  try {
    console.log('🔍 Consultando planos completos no banco...');
    
    const planos = await sequelize.query(
      'SELECT id, name, price, limits, overage FROM "Plans" ORDER BY id;',
      { type: QueryTypes.SELECT }
    );
    
    console.log('\n📋 RESULTADO COMPLETO DA CONSULTA:');
    console.log('='.repeat(80));
    
    if (planos.length === 0) {
      console.log('❌ Nenhum plano encontrado na tabela Plans');
    } else {
      planos.forEach((plano, index) => {
        console.log(`\n🔸 PLANO ${index + 1}:`);
        console.log(`   ID: ${plano.id}`);
        console.log(`   Nome: ${plano.name}`);
        console.log(`   Preço: R$ ${plano.price}`);
        console.log(`   Limits: ${JSON.stringify(plano.limits, null, 2)}`);
        console.log(`   Overage: ${JSON.stringify(plano.overage, null, 2)}`);
        console.log('-'.repeat(40));
      });
    }
    
    console.log(`\n📊 Total de planos encontrados: ${planos.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao consultar planos:', error.message);
  } finally {
    await sequelize.close();
  }
}

consultarPlanosCompleto();