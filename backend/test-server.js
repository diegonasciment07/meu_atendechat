const express = require('express');
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json());

// Debug das variáveis
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'CARREGADA' : 'NÃO ENCONTRADA');

// Configurar Sequelize com DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

// Endpoint de health check
app.get('/api/healthcheck', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            status: 'OK',
            timestamp: new Date(),
            database: 'Connected to Supabase',
            message: 'Backend funcionando com Supabase remoto'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date(),
            database: 'Connection failed',
            error: error.message
        });
    }
});

// Endpoint para listar planos
app.get('/api/plans', async (req, res) => {
    try {
        const [results] = await sequelize.query(
            'SELECT id, name, users, connections, value FROM "Plans" ORDER BY id',
            { type: sequelize.QueryTypes.SELECT }
        );
        
        res.json({
            status: 'success',
            data: results,
            message: `${results.length} planos encontrados no Supabase`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 Conectado ao Supabase: ${process.env.SUPABASE_URL}`);
    console.log(`✅ Endpoints disponíveis:`);
    console.log(`   GET /api/healthcheck - Status do backend`);
    console.log(`   GET /api/plans - Lista de planos`);
});

module.exports = app;