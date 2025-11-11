// Carregar dotenv com caminho absoluto
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('🔍 Carregando .env de:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Erro ao carregar .env:', result.error);
} else {
  console.log('✅ .env carregado com sucesso');
}

console.log('🔍 Variáveis após carregar .env:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_DIALECT:', process.env.DB_DIALECT);

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function testDB() {
  try {
    console.log('🔄 Testando conexão com banco...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida!');
    
    // Listar planos
    const plans = await sequelize.query('SELECT name, price FROM "Plans" ORDER BY id', { 
      type: QueryTypes.SELECT 
    });
    
    console.log('\n📋 Planos encontrados:');
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - R$ ${plan.price}`);
    });
    
    // Verificar tabela UsageCounters
    const counters = await sequelize.query('SELECT COUNT(*) as total FROM "UsageCounters"', { 
      type: QueryTypes.SELECT 
    });
    
    console.log(`\n📊 UsageCounters: ${counters[0].total} registros`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro completo:', err);
    console.error('❌ Mensagem:', err.message);
    console.error('❌ Stack:', err.stack);
    process.exit(1);
  }
}

testDB();