require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST,   // GoDaddy host
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,                  // cPanel DB user
  password: process.env.DB_PASSWORD,          // DB password
  database: process.env.DB_NAME,              // cPanel_dbname
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log("DB CONFIG:", {
  host: config.host,
  database: config.database,
  user: config.user,
});

const pool = mysql.createPool(config);

module.exports = pool;