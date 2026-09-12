const router = require("express").Router();
const prisma = require("../prisma");
const { auth, requireAdmin } = require("../middleware/auth");

// GET /api/users (admin only) - list customers
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

module.exports = router;
