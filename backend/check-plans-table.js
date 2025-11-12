const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkPlansTable() {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA PLANS...');
        
        // Verificar colunas da tabela Plans
        const columns = await sequelize.query(
            "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'Plans' ORDER BY ordinal_position;",
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('Colunas da tabela Plans:');
        columns.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
        // Verificar dados existentes
        const plans = await sequelize.query(
            'SELECT id, name, price, users, connections, queues FROM "Plans" LIMIT 5;',
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('\nPlanos existentes:');
        plans.forEach(plan => {
            console.log(`- ID: ${plan.id}, Nome: ${plan.name}, Preço: ${plan.price}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkPlansTable();