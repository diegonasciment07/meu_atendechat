// Teste direto com Sequelize para Supabase
const dotenv = require('dotenv');
const path = require('path');
const { Sequelize } = require('sequelize');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('🔄 ETAPA 3 - Testando Sequelize com Supabase...');
console.log('='.repeat(60));

async function testarSequelizeSupabase() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
    username: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASS,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  });

  try {
    console.log('🔗 Testando autenticação Sequelize...');
    await sequelize.authenticate();
    console.log('✅ Conexão Sequelize estabelecida com Supabase!');
    
    // Testar query simples
    console.log('\n🧪 Executando query de teste...');
    const [results] = await sequelize.query('SELECT version();');
    console.log('✅ PostgreSQL Version:', results[0].version.split(' ')[1]);
    
    // Verificar tabelas
    console.log('\n🔍 Verificando tabelas existentes...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📋 Tabelas encontradas: ${tables.length}`);
    if (tables.length > 0) {
      console.log('   Algumas tabelas:');
      tables.slice(0, 5).forEach(table => {
        console.log(`   • ${table.table_name}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro Sequelize:', error.message);
    return false;
  } finally {
    await sequelize.close();
  }
}

testarSequelizeSupabase().then(success => {
  if (success) {
    console.log('\n🎉 SEQUELIZE CONECTADO AO SUPABASE COM SUCESSO!');
    console.log('✅ Pronto para executar migrations');
  } else {
    console.log('\n❌ FALHA NA CONEXÃO SEQUELIZE');
  }
});