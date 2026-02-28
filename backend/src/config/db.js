require("dotenv").config();
const { Pool } = require("pg");

// For debugging connection issues log values to ensure they are strings
const config = {
  host: String(process.env.DB_HOST || "localhost"),
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: String(process.env.DB_NAME || "gymwebsite_db"),
  user: String(process.env.DB_USER || "postgres"),
};

// only add password if one is provided so pg doesn't send an empty string
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

const pool = new Pool(config);

// When the password is not a string PostgreSQL client complains, make sure envs are sane
if (typeof pool.options.password !== 'string') {
  console.warn('⚠️ DB_PASSWORD is not a string, forcing to string');
  pool.options.password = String(pool.options.password);
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = pool;