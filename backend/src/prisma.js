const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance across the app
// and across hot-reloads in development.
const prisma = global.__nourPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__nourPrisma = prisma;
}

module.exports = prisma;