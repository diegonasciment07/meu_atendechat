// Teste de conexão com banco PostgreSQL do Supabase
const dotenv = require('dotenv');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('🔄 ETAPA 3 - Testando conexão com PostgreSQL do Supabase...');
console.log('='.repeat(70));

async function testarConexaoSupabase() {
  // Tentar diferentes configurações SSL
  const connectionString = `postgresql://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASS}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}?sslmode=require`;
  
  console.log('🔗 Connection string (mascarada):');
  console.log(`postgresql://postgres:***@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}?sslmode=require`);
  
  const client = new Client({
    connectionString: connectionString,
    ssl: true
  });

  try {
    console.log('🔗 Conectando ao PostgreSQL do Supabase...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query básica
    console.log('\n🧪 Testando query básica...');
    const result = await client.query('SELECT version();');
    console.log('✅ PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Verificar se tabela Plans existe
    console.log('\n🔍 Verificando se tabela Plans existe...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Plans'
      );
    `);
    
    const plansTableExists = tableCheck.rows[0].exists;
    console.log(`📋 Tabela Plans: ${plansTableExists ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
    
    if (plansTableExists) {
      console.log('\n📊 Consultando planos existentes...');
      const plansResult = await client.query('SELECT id, name, price FROM "Plans" ORDER BY id;');
      console.log(`📈 Planos encontrados: ${plansResult.rows.length}`);
      plansResult.rows.forEach(plan => {
        console.log(`   • ${plan.name}: R$ ${plan.price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  } finally {
    await client.end();
  }
  
  return true;
}

testarConexaoSupabase().then(success => {
  if (success) {
    console.log('\n🎉 TESTE DE CONEXÃO SUPABASE CONCLUÍDO COM SUCESSO');
    console.log('✅ Pronto para executar migrations no Supabase');
  } else {
    console.log('\n❌ FALHA NA CONEXÃO - Verificar credenciais');
  }
});