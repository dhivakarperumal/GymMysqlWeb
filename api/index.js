const express = require("express");
const cors = require("cors");
require("dotenv").config();

const logger = require("./backend/src/config/logger");

logger.info("API Handler initializing...");
logger.info("DATABASE_URL set: %s", !!process.env.DATABASE_URL);
logger.info("POSTGRES_PRISMA_URL set: %s", !!process.env.POSTGRES_PRISMA_URL);

// Import and test database connection
let db;
try {
  db = require("./backend/src/config/db");
  logger.info("Database module imported successfully");
} catch (err) {
  logger.error("CRITICAL: Failed to import database module: %s", err.message);
}

// optionally run migrations on startup (commented out to avoid delays)
// (async () => {
//   try {
//     const { runMigrations } = require("./backend/src/config/migrate");
//     await runMigrations();
//   } catch (err) {
//     console.error("migration startup error:", err.message);
//   }
// })();

// Import routes with error handling
let productRoutes, memberRoutes, planRoutes, facilityRoutes, equipmentRoutes, staffRoutes, serviceRoutes, authRoutes, orderRoutes;

try {
  productRoutes = require("./backend/src/routes/productRoutes");
  logger.info("✓ productRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import productRoutes: %s", err.message);
  productRoutes = (req, res) => res.status(500).json({ error: "productRoutes not available" });
}

try {
  memberRoutes = require("./backend/src/routes/memberRoutes");
  logger.info("✓ memberRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import memberRoutes: %s", err.message);
  memberRoutes = (req, res) => res.status(500).json({ error: "memberRoutes not available" });
}

try {
  planRoutes = require("./backend/src/routes/planRoutes");
  logger.info("✓ planRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import planRoutes: %s", err.message);
  planRoutes = (req, res) => res.status(500).json({ error: "planRoutes not available" });
}

try {
  facilityRoutes = require("./backend/src/routes/facilityRoutes");
  logger.info("✓ facilityRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import facilityRoutes: %s", err.message);
  facilityRoutes = (req, res) => res.status(500).json({ error: "facilityRoutes not available" });
}

try {
  equipmentRoutes = require("./backend/src/routes/equipmentRoutes");
  logger.info("✓ equipmentRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import equipmentRoutes: %s", err.message);
  equipmentRoutes = (req, res) => res.status(500).json({ error: "equipmentRoutes not available" });
}

try {
  staffRoutes = require("./backend/src/routes/staffRoutes");
  logger.info("✓ staffRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import staffRoutes: %s", err.message);
  staffRoutes = (req, res) => res.status(500).json({ error: "staffRoutes not available" });
}

try {
  serviceRoutes = require("./backend/src/routes/serviceRoutes");
  logger.info("✓ serviceRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import serviceRoutes: %s", err.message);
  serviceRoutes = (req, res) => res.status(500).json({ error: "serviceRoutes not available" });
}

try {
  authRoutes = require("./backend/src/routes/authRoutes");
  logger.info("✓ authRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import authRoutes: %s", err.message);
  authRoutes = (req, res) => res.status(500).json({ error: "authRoutes not available" });
}

try {
  orderRoutes = require("./backend/src/routes/orderRoutes");
  logger.info("✓ orderRoutes imported");
} catch (err) {
  logger.error("✗ Failed to import orderRoutes: %s", err.message);
  orderRoutes = (req, res) => res.status(500).json({ error: "orderRoutes not available" });
}

const app = express();

logger.info("Routes imported successfully");

/* ✅ CORS - Allow multiple ports */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      try {
        const url = new URL(origin);
        const isLocalhost =
          url.hostname === "localhost" || url.hostname === "127.0.0.1";
        if (isLocalhost) {
          return callback(null, true);
        }
      } catch (err) {
        // malformed origin, reject
      }
      // Allow production domains
      const allowed = [
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5173",
        "https://dhiva-deva-new-my-gym-2hs3.vercel.app",
      ];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      logger.warn("CORS rejected origin: %s", origin);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API routes with /api prefix
app.use("/api/products", productRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database status check
app.get("/api/db-status", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        status: "disconnected", 
        message: "Database module not initialized",
        hasEnvVars: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL
        }
      });
    }
    
    const result = await db.query("SELECT NOW()");
    res.json({ 
      status: "connected", 
      timestamp: new Date().toISOString(),
      dbTime: result.rows[0]?.now
    });
  } catch (err) {
    logger.error("Database health check error: %s", err.message);
    res.status(500).json({ 
      status: "error", 
      message: err.message,
      hasEnvVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL
      }
    });
  }
});

// Database initialization endpoint (creates all tables)
app.post("/api/init-db", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ 
          status: "error",
          message: "Database module not initialized"
        });
      }

      // Try to run initialization
      const { runMigrations } = require("./backend/src/config/migrate");
      await runMigrations();
      
      res.json({ 
        status: "success",
        message: "Database tables initialized successfully",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error("Database init error: %s", err.message);
      res.status(500).json({ 
        status: "error",
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
});

// 404 handler
app.use((req, res) => {
  logger.warn("404 - Route not found: %s %s", req.method, req.path);
  res.status(404).json({ error: "Not Found", path: req.path, method: req.method });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Express error: %O", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

logger.info("✓ API Handler setup complete");
logger.info("✓ Ready to accept requests");
logger.info("✓ Available endpoints:");
logger.info("  - GET /api/health");
logger.info("  - GET /api/db-status");
logger.info("  - POST /api/init-db");
logger.info("  - POST /api/auth/login");
logger.info("  - POST /api/auth/register");
logger.info("  - And all other routes...");

// Export as handler for Vercel serverless
module.exports = app;

