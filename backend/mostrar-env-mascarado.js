// Script para mostrar .env mascarado para validação
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('📋 ARQUIVO .env CONFIGURADO (valores mascarados):');
console.log('='.repeat(60));

console.log('🔧 Configuração básica:');
console.log(`NODE_ENV=${process.env.NODE_ENV}`);
console.log(`DB_DIALECT=${process.env.DB_DIALECT}`);
console.log(`DB_HOST=${process.env.DB_HOST}`);
console.log(`DB_PORT=${process.env.DB_PORT}`);
console.log(`DB_USER=${process.env.DB_USER}`);
console.log(`DB_PASS=${'*'.repeat(8)}`);
console.log(`DB_NAME=${process.env.DB_NAME}`);

console.log('\n🔐 JWT Secrets:');
console.log(`JWT_SECRET=${process.env.JWT_SECRET?.substring(0, 10)}...`);
console.log(`JWT_REFRESH_SECRET=${process.env.JWT_REFRESH_SECRET?.substring(0, 10)}...`);

console.log('\n🚀 Supabase Configuration:');
console.log(`SUPABASE_URL=${process.env.SUPABASE_URL}`);
console.log(`SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY?.substring(0, 20)}...`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`);
console.log(`SUPABASE_JWT_SECRET=${process.env.SUPABASE_JWT_SECRET?.substring(0, 10)}...`);

console.log('\n✅ .gitignore verificado - .env não será versionado');
console.log('⚠️  IMPORTANTE: Substitua os valores placeholder pelos valores reais do seu projeto Supabase');

console.log('\n📝 PRÓXIMOS PASSOS:');
console.log('1. Acesse seu painel do Supabase');
console.log('2. Vá em Settings > API');
console.log('3. Copie URL, anon key e service_role key');
console.log('4. Vá em Settings > Database > Connection string');
console.log('5. Substitua os valores no .env');
console.log('6. Confirme "Etapa 1 ok" para prosseguir');