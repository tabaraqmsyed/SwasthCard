const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is missing from server/.env");
  process.exit(1);
}

const authRoutes = require("./routes/auth");
const hospitalRoutes = require("./routes/hospitals");
const appointmentRoutes = require("./routes/appointments");
const recordRoutes = require("./routes/records");
const patientRoutes = require("./routes/patient");
const emergencyRoutes = require("./routes/emergency");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// Accept JSON requests, including profile photo data URLs.
app.use(express.json({ limit: "2mb" }));

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SwasthCard backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/patient", patientRoutes);

// Public emergency profile route.
// This route intentionally does not require login.
app.use("/api/emergency", emergencyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Internal server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An internal server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SwasthCard server running on http://localhost:${PORT}`);
});