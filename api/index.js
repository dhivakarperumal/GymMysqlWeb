const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("API Handler initializing...");
console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("POSTGRES_PRISMA_URL set:", !!process.env.POSTGRES_PRISMA_URL);

// optionally run migrations on startup (commented out to avoid delays)
// (async () => {
//   try {
//     const { runMigrations } = require("./backend/src/config/migrate");
//     await runMigrations();
//   } catch (err) {
//     console.error("migration startup error:", err.message);
//   }
// })();

// Import routes
const productRoutes = require("./backend/src/routes/productRoutes");
const memberRoutes = require("./backend/src/routes/memberRoutes");
const planRoutes = require("./backend/src/routes/planRoutes");
const facilityRoutes = require("./backend/src/routes/facilityRoutes");
const equipmentRoutes = require("./backend/src/routes/equipmentRoutes");
const staffRoutes = require("./backend/src/routes/staffRoutes");
const serviceRoutes = require("./backend/src/routes/serviceRoutes");
const authRoutes = require("./backend/src/routes/authRoutes");
const orderRoutes = require("./backend/src/routes/orderRoutes");

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

console.log("API Handler setup complete");

// Export as handler for Vercel serverless
module.exports = app;

