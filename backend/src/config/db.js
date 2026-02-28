require("dotenv").config();
const mysql = require("mysql2/promise");

let config;

// Priority: DATABASE_URL > individual env vars
if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for connection");
  // Parse MySQL connection string
  config = {
    uri: process.env.DATABASE_URL,
  };
} else {
  // Fallback to individual env vars for local development
  console.log("Using individual DB env vars for connection");
  config = {
    host: String(process.env.DB_HOST || "localhost"),
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: String(process.env.DB_NAME || "gymwebsite_db"),
    user: String(process.env.DB_USER || "root"),
  };

  // only add password if one is provided
  if (process.env.DB_PASSWORD != null && process.env.DB_PASSWORD !== "") {
    config.password = String(process.env.DB_PASSWORD);
  }

  console.log("DB config", {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    passwordProvided: config.password != null,
    passwordType: config.password ? typeof config.password : null,
    passwordLength: config.password ? config.password.length : 0,
  });
}

const pool = mysql.createPool(config);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = pool;