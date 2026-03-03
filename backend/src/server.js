const express = require("express");
const cors = require("cors");
require("dotenv").config();

// optionally run migrations on start, helps when launching dev server
(async () => {
  try {
    const { runMigrations } = require("./config/migrate");
    await runMigrations();
  } catch (err) {
    console.error("migration startup error:", err.message);
  }
})();

// Import routes
const productRoutes = require("./routes/productRoutes");
const memberRoutes = require("./routes/memberRoutes");
const planRoutes = require("./routes/planRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const userRoutes = require("./routes/userRoutes");
// other routes can be added later

const app = express();

/* ✅ EXACT CORS FIX - Allow multiple ports */

// allow requests from localhost on any port plus typical dev hosts
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // some tools (curl, Postman) omit origin
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
      // optionally allow your production domain(s) here:
      const allowed = [
        "https://yourproductiondomain.com",
        "https://api.yourproductiondomain.com",
      ];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// allow large payloads (images encoded as base64 can be big)
app.use(express.json({ limit: '50mb' }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// simple database connectivity check (useful during development)
app.get("/api/db-check", async (req, res) => {
  try {
    const db = require("./config/db");
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({ ok: true, rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});


app.use("/api/products", productRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
