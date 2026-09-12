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

// Fail fast rather than run insecurely in production.
if (isProd) {
  const problems = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-this-secret-in-production") {
    problems.push("JWT_SECRET غير مضبوط بقيمة آمنة (شغّلي: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\" وحطي الناتج في .env)");
  }
  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === "*") {
    problems.push("CORS_ORIGIN لازم يكون دومين الفرونت اند الحقيقي، مش *");
  }
  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL غير مضبوط");
  }
  if (problems.length) {
    console.error("❌ السيرفر مش هيشتغل في وضع الإنتاج بسبب إعدادات غير آمنة:");
    problems.forEach((p) => console.error("   - " + p));
    process.exit(1);
  }
}

const app = express();

// Required for correct client IPs (and therefore correct rate limiting)
// when running behind a reverse proxy / load balancer in production.
app.set("trust proxy", 1);

app.use(helmet());
const allowedOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);

  const isAllowed =
    origin === process.env.CORS_ORIGIN ||
    /^https:\/\/nour-store-[a-z0-9]+-mhmd-ataas-projects\.vercel\.app$/.test(origin);

  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

app.use(cors({ origin: allowedOrigin }));app.use(express.json({ limit: "1mb" }));

// General API rate limit, plus a stricter one for auth endpoints to slow
// down credential-stuffing / brute-force attempts.
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "محاولات كثيرة جدًا، حاولي تاني بعد شوية" },
  })
);

app.get("/api/health", (req, res) => res.json({ status: "ok", store: "Nour Store" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/cart", cartRoutes);
// 404 fallback
app.use((req, res) => res.status(404).json({ message: "المسار غير موجود" }));

// Generic error handler — never leak internals in production.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: isProd ? "حدث خطأ في الخادم" : err.message });
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`✨ Nour Store API running on http://localhost:${PORT} (${isProd ? "production" : "development"})`);
});

// Close the Prisma connection pool cleanly when the process stops.
const prisma = require("./prisma");
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
