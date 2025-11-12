// Debug das variáveis do Supabase
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('🔍 DEBUG - Variáveis do Supabase:');
console.log('='.repeat(50));

console.log('SUPABASE_DB_HOST:', process.env.SUPABASE_DB_HOST);
console.log('SUPABASE_DB_PORT:', process.env.SUPABASE_DB_PORT);
console.log('SUPABASE_DB_USER:', process.env.SUPABASE_DB_USER);
console.log('SUPABASE_DB_NAME:', process.env.SUPABASE_DB_NAME);
console.log('SUPABASE_DB_PASS length:', process.env.SUPABASE_DB_PASS?.length);
console.log('SUPABASE_DB_PASS first 5 chars:', process.env.SUPABASE_DB_PASS?.substring(0, 5));

// Testar string de conexão
const connectionString = `postgresql://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASS}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`;
console.log('\nConnection string completa (mascarada):');
console.log(connectionString.replace(process.env.SUPABASE_DB_PASS, '***'));