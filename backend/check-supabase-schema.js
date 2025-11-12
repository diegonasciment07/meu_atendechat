const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkSupabaseSchema() {
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
        const results = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public';",
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('🔍 VERIFICANDO SCHEMA SUPABASE...');
        console.log('Tabelas existentes no schema public:', results);
        console.log(`Total de tabelas: ${results.length}`);
        
        if (results.length === 0) {
            console.log('✅ Schema está vazio - seguro para aplicar migrations');
            return true;
        } else {
            console.log('⚠️ Schema já possui tabelas - revisar antes de aplicar migrations');
            console.log('Tabelas encontradas:', results.map(r => r.table_name));
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar schema:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkSupabaseSchema();