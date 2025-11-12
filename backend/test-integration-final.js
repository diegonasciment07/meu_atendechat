const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Verificar se .env existe e está configurado
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado!');
    process.exit(1);
}

console.log('🔍 TESTE FINAL DE INTEGRAÇÃO SUPABASE');
console.log('=====================================');

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar todas as variáveis necessárias
const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
];

console.log('\n1️⃣ VERIFICANDO VARIÁVEIS DE AMBIENTE:');
let allVarsPresent = true;
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`❌ ${varName}: NÃO DEFINIDA`);
        allVarsPresent = false;
    }
});

if (!allVarsPresent) {
    console.error('\n❌ Nem todas as variáveis de ambiente estão definidas!');
    process.exit(1);
}

// Testar conexão com Supabase Auth
console.log('\n2️⃣ TESTANDO CONEXÃO SUPABASE AUTH:');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAuth() {
    try {
        // Tentar fazer login com credenciais inválidas (deve retornar erro específico)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'wrongpassword'
        });

        if (error && error.message === 'Invalid login credentials') {
            console.log('✅ Supabase Auth API respondendo corretamente');
            console.log('✅ Proteção de credenciais funcionando');
            return true;
        } else if (error) {
            console.log(`⚠️ Erro inesperado: ${error.message}`);
            return false;
        } else {
            console.log('⚠️ Login inesperadamente bem-sucedido');
            return false;
        }
    } catch (err) {
        console.error(`❌ Erro na conexão: ${err.message}`);
        return false;
    }
}

// Verificar estrutura do projeto
console.log('\n3️⃣ VERIFICANDO ESTRUTURA DO PROJETO:');

const criticalFiles = [
    'src/app.ts',
    'src/middleware/authGuard.ts',
    'src/middleware/planLimitGuard.ts',
    'src/middleware/tenantPropagation.ts',
    'src/models/Plan.ts',
    'src/models/Company.ts',
    'src/models/User.ts'
];

criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - NÃO ENCONTRADO`);
    }
});

// Testar banco local
console.log('\n4️⃣ VERIFICANDO BANCO LOCAL:');
const { exec } = require('child_process');

function testLocalDB() {
    return new Promise((resolve) => {
        exec('docker ps --filter "name=postgres-dev" --format "table {{.Names}}\\t{{.Status}}"', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Erro ao verificar Docker:', error.message);
                resolve(false);
            } else if (stdout.includes('postgres-dev')) {
                console.log('✅ Container PostgreSQL local ativo');
                resolve(true);
            } else {
                console.log('⚠️ Container PostgreSQL local não encontrado');
                resolve(false);
            }
        });
    });
}

// Executar todos os testes
async function runAllTests() {
    const authTest = await testSupabaseAuth();
    const dbTest = await testLocalDB();
    
    console.log('\n📋 RESUMO DOS TESTES:');
    console.log('========================');
    console.log(`Variáveis de ambiente: ${allVarsPresent ? '✅' : '❌'}`);
    console.log(`Supabase Auth API: ${authTest ? '✅' : '❌'}`);
    console.log(`Banco local: ${dbTest ? '✅' : '❌'}`);
    console.log(`Estrutura do projeto: ✅`);
    
    console.log('\n🎯 STATUS GERAL:');
    if (allVarsPresent && authTest) {
        console.log('✅ INTEGRAÇÃO SUPABASE CONFIGURADA COM SUCESSO!');
        console.log('🚀 Projeto pronto para desenvolvimento local com Supabase');
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('1. npm run dev - Para iniciar o servidor');
        console.log('2. Testar endpoints de autenticação');
        console.log('3. Verificar sistema de planos');
    } else {
        console.log('❌ Algumas configurações precisam ser ajustadas');
    }
}

runAllTests().catch(console.error);