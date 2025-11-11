// Consulta específica para listar planos ordenados
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function consultarPlanos() {
  try {
    console.log('🔍 Consultando todos os planos no banco...');
    
    const planos = await sequelize.query(
      'SELECT id, name, price FROM "Plans" ORDER BY id;',
      { type: QueryTypes.SELECT }
    );
    
    console.log('\n📋 RESULTADO DA CONSULTA:');
    console.log('ID | Nome | Preço');
    console.log('---|------|-------');
    
    planos.forEach(plano => {
      console.log(`${plano.id} | ${plano.name} | R$ ${plano.price}`);
    });
    
    console.log(`\n📊 Total de planos encontrados: ${planos.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao consultar planos:', error.message);
  } finally {
    await sequelize.close();
  }
}

consultarPlanos();