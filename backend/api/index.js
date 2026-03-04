const express = require("express");
const cors = require("cors");
require("dotenv").config();

// optionally run migrations on start, helps when launching dev server
(async () => {
  try {
    const { runMigrations } = require("../src/config/migrate");
    await runMigrations();
  } catch (err) {
    console.error("migration startup error:", err.message);
  }
})();

// Import routes
const productRoutes = require("../src/routes/productRoutes");
const memberRoutes = require("../src/routes/memberRoutes");
const planRoutes = require("../src/routes/planRoutes");
const facilityRoutes = require("../src/routes/facilityRoutes");
const equipmentRoutes = require("../src/routes/equipmentRoutes");
const staffRoutes = require("../src/routes/staffRoutes");
const serviceRoutes = require("../src/routes/serviceRoutes");
const authRoutes = require("../src/routes/authRoutes");
const orderRoutes = require("../src/routes/orderRoutes");
const assignmentRoutes = require("../src/routes/assignmentRoutes");

const app = express();

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
      ];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API routes
app.use("/api/products", productRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/workouts", require("../src/routes/workoutRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

module.exports = app;
