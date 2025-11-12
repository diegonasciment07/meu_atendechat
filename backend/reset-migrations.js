const { Sequelize } = require('sequelize');
require('dotenv').config();

async function resetMigrationsTable() {
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
        console.log('🔄 RESETANDO CONTROLE DE MIGRATIONS...');
        
        // Verificar se existe tabela SequelizeMeta
        const [metaExists] = await sequelize.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta');",
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log('Tabela SequelizeMeta existe:', metaExists.exists);
        
        if (metaExists.exists) {
            console.log('🗑️ Removendo tabela SequelizeMeta...');
            await sequelize.query('DROP TABLE IF EXISTS "SequelizeMeta";');
            console.log('✅ Tabela SequelizeMeta removida');
        }
        
        console.log('✅ Sistema pronto para aplicar migrations do zero');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await sequelize.close();
    }
}

resetMigrationsTable();