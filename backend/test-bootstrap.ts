// Teste simples das variáveis de ambiente
import './src/bootstrap'; // Bootstrap da aplicação

console.log('🔍 Testando bootstrap da aplicação:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_DIALECT:', process.env.DB_DIALECT);

console.log('✅ Bootstrap funcionou correctament!');