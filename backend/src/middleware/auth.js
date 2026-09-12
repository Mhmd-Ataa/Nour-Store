const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nour-dev-secret";

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "جلسة غير صالحة، سجّلي الدخول مرة أخرى" });
  }
}

// يسمح للمستخدم المسجل والـGuest
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  // Guest
  if (!header) {
    req.user = null;
    return next();
  }

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "جلسة غير صالحة" });
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "جلسة غير صالحة، سجّلي الدخول مرة أخرى" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "غير مصرح لك بهذا الإجراء" });
  }

  next();
}

module.exports = {
  auth,
  optionalAuth,
  requireAdmin,
  JWT_SECRET,
};