const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("API Handler initializing...");
console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("POSTGRES_PRISMA_URL set:", !!process.env.POSTGRES_PRISMA_URL);

// Import and test database connection
let db;
try {
  db = require("./backend/src/config/db");
  console.log("Database module imported successfully");
} catch (err) {
  console.error("CRITICAL: Failed to import database module:", err.message);
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
  console.log("✓ productRoutes imported");
} catch (err) {
  console.error("✗ Failed to import productRoutes:", err.message);
  productRoutes = (req, res) => res.status(500).json({ error: "productRoutes not available" });
}

try {
  memberRoutes = require("./backend/src/routes/memberRoutes");
  console.log("✓ memberRoutes imported");
} catch (err) {
  console.error("✗ Failed to import memberRoutes:", err.message);
  memberRoutes = (req, res) => res.status(500).json({ error: "memberRoutes not available" });
}

try {
  planRoutes = require("./backend/src/routes/planRoutes");
  console.log("✓ planRoutes imported");
} catch (err) {
  console.error("✗ Failed to import planRoutes:", err.message);
  planRoutes = (req, res) => res.status(500).json({ error: "planRoutes not available" });
}

try {
  facilityRoutes = require("./backend/src/routes/facilityRoutes");
  console.log("✓ facilityRoutes imported");
} catch (err) {
  console.error("✗ Failed to import facilityRoutes:", err.message);
  facilityRoutes = (req, res) => res.status(500).json({ error: "facilityRoutes not available" });
}

try {
  equipmentRoutes = require("./backend/src/routes/equipmentRoutes");
  console.log("✓ equipmentRoutes imported");
} catch (err) {
  console.error("✗ Failed to import equipmentRoutes:", err.message);
  equipmentRoutes = (req, res) => res.status(500).json({ error: "equipmentRoutes not available" });
}

try {
  staffRoutes = require("./backend/src/routes/staffRoutes");
  console.log("✓ staffRoutes imported");
} catch (err) {
  console.error("✗ Failed to import staffRoutes:", err.message);
  staffRoutes = (req, res) => res.status(500).json({ error: "staffRoutes not available" });
}

try {
  serviceRoutes = require("./backend/src/routes/serviceRoutes");
  console.log("✓ serviceRoutes imported");
} catch (err) {
  console.error("✗ Failed to import serviceRoutes:", err.message);
  serviceRoutes = (req, res) => res.status(500).json({ error: "serviceRoutes not available" });
}

try {
  authRoutes = require("./backend/src/routes/authRoutes");
  console.log("✓ authRoutes imported");
} catch (err) {
  console.error("✗ Failed to import authRoutes:", err.message);
  authRoutes = (req, res) => res.status(500).json({ error: "authRoutes not available" });
}

try {
  orderRoutes = require("./backend/src/routes/orderRoutes");
  console.log("✓ orderRoutes imported");
} catch (err) {
  console.error("✗ Failed to import orderRoutes:", err.message);
  orderRoutes = (req, res) => res.status(500).json({ error: "orderRoutes not available" });
}

const app = express();

console.log("Routes imported successfully");

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
      console.log("CORS rejected origin:", origin);
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
    console.error("Database health check error:", err.message);
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
    console.error("Database init error:", err.message);
    res.status(500).json({ 
      status: "error",
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.path);
  res.status(404).json({ error: "Not Found", path: req.path, method: req.method });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

console.log("✓ API Handler setup complete");
console.log("✓ Ready to accept requests");
console.log("✓ Available endpoints:");
console.log("  - GET /api/health");
console.log("  - GET /api/db-status");
console.log("  - POST /api/init-db");
console.log("  - POST /api/auth/login");
console.log("  - POST /api/auth/register");
console.log("  - And all other routes...");

// Export as handler for Vercel serverless
module.exports = app;

