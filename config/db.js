// Backwards-compatible stub. The project can use either MySQL or the local JSON store.
const useJson = true; // force JSON DB per user request
if (useJson) {
  module.exports = require('./jsonStore');
} else {
  const mysql = require('mysql2/promise');
  const dotenv = require('dotenv');
  dotenv.config();
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestao_financeira',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  module.exports = pool;
}
