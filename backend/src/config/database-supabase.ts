// Configuração específica para Supabase
import "../bootstrap";

module.exports = {
  development: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: String(process.env.DB_PASS),
    logging: false,
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    }
  },
  supabase: {
    dialect: "postgres",
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME,
    username: process.env.SUPABASE_DB_USER,
    password: String(process.env.SUPABASE_DB_PASS),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: (msg) => console.log(`[Supabase] ${msg}`),
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    }
  }
};