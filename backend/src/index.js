
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const ordersRoutes = require("./routes/orders.routes");
const cartRoutes = require("./routes/cart.routes");
const usersRoutes = require("./routes/users.routes");
const paymentsRoutes = require("./routes/payments.routes");

const isProd = process.env.NODE_ENV === "production";

// Validate required production environment variables.
if (isProd) {
  const problems = [];

  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === "change-this-secret-in-production"
  ) {
    problems.push("JWT_SECRET is missing or uses an insecure default.");
  }

  if (
    !process.env.CORS_ORIGIN ||
    process.env.CORS_ORIGIN === "*"
  ) {
    problems.push("CORS_ORIGIN must be the actual frontend origin.");
  }

  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL is missing.");
  }

  if (problems.length) {
    console.error(
      "Server cannot start because production environment variables are invalid:"
    );

    problems.forEach((problem) => console.error(`- ${problem}`));

    process.exit(1);
  }
}

const app = express();

// Trust the hosting platform's reverse proxy.
app.set("trust proxy", 1);

app.use(helmet());

// Allow requests only from the configured frontend origin.
const allowedOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  const isAllowed = origin === process.env.CORS_ORIGIN;

  if (isAllowed) {
    return callback(null, true);
  }

  return callback(new Error("Not allowed by CORS"));
};

app.use(cors({ origin: allowedOrigin }));

app.use(express.json({ limit: "1mb" }));

// General API rate limit.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter rate limit for authentication endpoints.
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "محاولات كثيرة جدًا، حاولي تاني بعد شوية",
    },
  })
);

// Health check.
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    store: "Nour Store",
  });
});

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/cart", cartRoutes);

// 404 fallback.
app.use((req, res) => {
  res.status(404).json({
    message: "المسار غير موجود",
  });
});

// Generic error handler.
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: isProd ? "حدث خطأ في الخادم" : err.message,
  });
});

// Start server.
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(
    `Nour Store API running on port ${PORT} (${isProd ? "production" : "development"})`
  );
});

// Prisma connection cleanup.
const prisma = require("./prisma");

let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Shutting down server...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.error("Error disconnecting Prisma:", error);
      process.exit(1);
    }
  });

  // Force shutdown if existing connections do not close in time.
  setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
