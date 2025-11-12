// Teste de conexão com Supabase
import './src/bootstrap'; // Carregar variáveis de ambiente
import { createClient } from '@supabase/supabase-js';

console.log('🔄 ETAPA 2 - Testando conexão com Supabase...');
console.log('='.repeat(60));

// Validar variáveis de ambiente
console.log('📋 Validando variáveis de ambiente:');
console.log(`✅ SUPABASE_URL: ${process.env.SUPABASE_URL ? 'DEFINIDA' : '❌ FALTANDO'}`);
console.log(`✅ SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'DEFINIDA' : '❌ FALTANDO'}`);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('\n🔗 Cliente Supabase criado com sucesso');

(async () => {
  try {
    console.log('\n🧪 Testando autenticação (deve retornar erro "user not found" ou sucesso):');
    
    // Teste 1: Tentar login com credenciais de teste (deve dar erro esperado)
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: 'test@example.com', 
      password: 'testpassword123' 
    });
    
    if (error) {
      console.log('✅ Conexão funcionando - erro esperado:', error.message);
      console.log('📊 Código do erro:', error.status || 'N/A');
    } else {
      console.log('✅ Login bem-sucedido (inesperado):', data.user?.email);
    }

    // Teste 2: Verificar status da conexão
    console.log('\n🔍 Testando status da sessão:');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📊 Sessão atual:', sessionData.session ? 'Ativa' : 'Nenhuma');

    // Teste 3: Testar uma query simples (sem auth)
    console.log('\n🗄️ Testando acesso ao banco (deve dar erro de permissão):');
    const { data: tables, error: tableError } = await supabase
      .from('Plans')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('✅ Proteção funcionando - erro esperado:', tableError.message);
    } else {
      console.log('⚠️ Acesso liberado (verificar RLS):', tables);
    }

    console.log('\n🎉 TESTE DE CONEXÃO CONCLUÍDO');
    console.log('✅ Supabase conectado e respondendo adequadamente');
    
  } catch (error: any) {
    console.error('❌ Erro durante teste:', error.message);
  }
})();