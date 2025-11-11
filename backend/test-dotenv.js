const dotenv = require('dotenv');
const path = require('path');

console.log('🔍 Teste do dotenv');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Testar diferentes formas de carregar
console.log('\n1. Teste com caminho relativo:');
const result1 = dotenv.config();
if (result1.error) {
  console.error('Erro:', result1.error.message);
}
console.log('DB_USER after relative:', process.env.DB_USER);

console.log('\n2. Teste com caminho absoluto:');
const envPath = path.join(__dirname, '.env');
console.log('Tentando carregar de:', envPath);
const result2 = dotenv.config({ path: envPath });
if (result2.error) {
  console.error('Erro:', result2.error.message);
} else {
  console.log('Parsed:', result2.parsed);
}
console.log('DB_USER after absolute:', process.env.DB_USER);

console.log('\n2b. Teste lendo arquivo manualmente:');
const fs = require('fs');
try {
  const fileContent = fs.readFileSync(envPath, 'utf8');
  console.log('Conteúdo do arquivo:');
  console.log(JSON.stringify(fileContent));
  
  // Tentar parse manual
  const lines = fileContent.split('\n');
  console.log('Linhas encontradas:', lines.length);
  lines.forEach((line, index) => {
    console.log(`Linha ${index}:`, JSON.stringify(line));
  });
} catch (err) {
  console.error('Erro lendo arquivo:', err.message);
}

console.log('\n3. Todas as variáveis env relacionadas a DB:');
Object.keys(process.env)
  .filter(key => key.startsWith('DB_') || key.startsWith('NODE_'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });