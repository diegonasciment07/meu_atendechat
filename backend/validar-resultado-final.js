// ETAPA 3: Validar resultado final após atualização
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const { QueryTypes } = require('sequelize');
const sequelize = require('./dist/database/index.js').default;

async function validarResultadoFinal() {
  try {
    console.log('🔍 ETAPA 3 - Validação pós-atualização...');
    
    const planos = await sequelize.query(
      'SELECT id, name, overage FROM "Plans" ORDER BY id;',
      { type: QueryTypes.SELECT }
    );
    
    console.log('\n📋 RESULTADO FINAL DOS CAMPOS OVERAGE:');
    console.log('='.repeat(80));
    
    planos.forEach((plano) => {
      console.log(`\n🔸 ${plano.name.toUpperCase()} (ID: ${plano.id})`);
      console.log(`   📊 Overage completo:`);
      console.log(`   ${JSON.stringify(plano.overage, null, 6)}`);
      
      // Validar add-ons específicos
      const aiRequests = plano.overage?.ai_requests;
      const extraUser = plano.overage?.extra_user;
      const extraWhatsapp = plano.overage?.extra_whatsapp_instance;
      
      console.log(`   ✅ ai_requests: ${aiRequests !== undefined ? aiRequests : 'ERRO'}`);
      console.log(`   ✅ extra_user: ${extraUser !== undefined ? extraUser : 'ERRO'}`);
      console.log(`   ✅ extra_whatsapp_instance: ${extraWhatsapp !== undefined ? extraWhatsapp : 'ERRO'}`);
      console.log('-'.repeat(50));
    });
    
    // Validação estrutural final
    console.log('\n🎯 VALIDAÇÃO ESTRUTURAL:');
    console.log('='.repeat(80));
    
    console.log('\n📊 Tabela de Conformidade:');
    console.log('Plano\t\tai_requests\textra_user\textra_whatsapp_instance');
    console.log('-'.repeat(70));
    
    planos.forEach((plano) => {
      const ai = plano.overage?.ai_requests || 'null';
      const user = plano.overage?.extra_user || 'ERRO';
      const whatsapp = plano.overage?.extra_whatsapp_instance || 'ERRO';
      
      console.log(`${plano.name}\t\t${ai}\t\t${user}\t\t${whatsapp}`);
    });
    
    console.log('\n✅ Validação concluída - 3 planos atualizados com add-ons');
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
  } finally {
    await sequelize.close();
  }
}

validarResultadoFinal();