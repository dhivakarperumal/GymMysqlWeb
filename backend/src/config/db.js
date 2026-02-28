require("dotenv").config();
const { Pool } = require("pg");

let config;

// Priority: DATABASE_URL > POSTGRES_PRISMA_URL > individual env vars
if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for connection");
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else if (process.env.POSTGRES_PRISMA_URL) {
  console.log("Using POSTGRES_PRISMA_URL for connection");
  config = {
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  // Fallback to individual env vars for local development
  console.log("Using individual DB env vars for connection");
  config = {
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
}

const pool = new Pool(config);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = pool;