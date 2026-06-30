const { Pool } = require('pg');

// String de conexão do banco PostgreSQL (Render, Supabase, Railway, etc.)
// Configurada via variável de ambiente DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[AVISO] DATABASE_URL não foi definida. Configure o arquivo .env');
}

const pool = new Pool({
  connectionString,
  // A maioria dos provedores de nuvem (Render, Supabase, Railway) exige SSL
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});

module.exports = pool;
