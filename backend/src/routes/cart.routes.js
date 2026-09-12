const router = require("express").Router();

const prisma = require("../prisma");
const { auth } = require("../middleware/auth");

console.log("PRISMA CART:", prisma.cart);
console.log("PRISMA CART ITEM:", prisma.cartItem);

// GET /api/cart
// جلب السلة الخاصة بالمستخدم الحالي
router.get("/", auth, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: {
        userId: req.user.id,
      },
      include: {
        items: {
          where: {
            product: {
              isActive: true,
            },
          },
          include: {
            product: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    // لو المستخدم لسه معندوش Cart
    if (!cart) {
      return res.json({
        cart: {
          id: null,
          userId: req.user.id,
          items: [],
        },
      });
    }

    res.json({ cart });
  } catch (err) {
    console.error("CART ERROR:", err);
    res.status(500).json({
      message: "حدث خطأ أثناء جلب السلة",
      error: err.message
    });
  }
});


// POST /api/cart/items
// إضافة منتج للسلة
router.post("/items", auth, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;

    const cleanProductId = Number(productId);
    const quantity = Number(qty);

    if (!Number.isInteger(cleanProductId) || cleanProductId <= 0) {
      return res.status(400).json({
        message: "معرّف المنتج غير صحيح",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        message: "الكمية يجب أن تكون بين 1 و100",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "الكمية غير صحيحة",
      });
    }

    // التأكد أن المنتج موجود
    const product = await prisma.product.findFirst({
      where: {
        id: cleanProductId, isActive: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "المنتج غير موجود",
      });
    }

    // التأكد من الـstock
    if (product.stock < quantity) {
      return res.status(400).json({
        message: "الكمية المطلوبة غير متوفرة في المخزون",
      });
    }

    // إنشاء Cart للمستخدم لو مش موجود
    const cart = await prisma.cart.upsert({
      where: {
        userId: req.user.id,
      },
      update: {},
      create: {
        userId: req.user.id,
      },
    });

    // إضافة المنتج أو زيادة الكمية لو موجود بالفعل
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
productId: cleanProductId,        },
      },
      update: {
        qty: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: Number(productId),
        qty: quantity,
      },
      include: {
        product: true,
      },
    });

    // التأكد بعد الزيادة إننا معديناش الـstock
    if (cartItem.qty > product.stock) {
      // نرجع الكمية للوضع السابق
      await prisma.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          qty: {
            decrement: quantity,
          },
        },
      });

      return res.status(400).json({
        message: "الكمية المطلوبة أكبر من المتوفر في المخزون",
      });
    }

    res.status(201).json({
      message: "تمت إضافة المنتج للسلة",
      item: cartItem,
    });
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);

    res.status(500).json({
      message: "حدث خطأ أثناء إضافة المنتج للسلة",
    });
  }
});


// PUT /api/cart/items/:productId
// تعديل كمية منتج في السلة
router.put("/items/:productId", auth, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const quantity = Number(req.body.qty);

if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        message: "الكمية غير صحيحة",
      });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "المنتج غير موجود",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: "الكمية المطلوبة أكبر من المتوفر",
      });
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "السلة غير موجودة",
      });
    }

    const item = await prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        productId: productId,
      },
      data: {
        qty: quantity,
      },
    });

    if (item.count === 0) {
      return res.status(404).json({
        message: "المنتج غير موجود في السلة",
      });
    }

    const updatedItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
      },
      include: {
        product: true,
      },
    });

    res.json({
      message: "تم تعديل الكمية",
      item: updatedItem,
    });
  } catch (err) {
    console.error("UPDATE CART ERROR:", err);

    res.status(500).json({
      message: "حدث خطأ أثناء تعديل السلة",
    });
  }
});


// DELETE /api/cart/items/:productId
// حذف منتج من السلة
router.delete("/items/:productId", auth, async (req, res) => {
  try {
const productId = Number(req.params.productId);

if (!Number.isInteger(productId) || productId <= 0) {
  return res.status(400).json({
    message: "معرّف المنتج غير صحيح",
  });
}
    const cart = await prisma.cart.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "السلة غير موجودة",
      });
    }

    const deleted = await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        message: "المنتج غير موجود في السلة",
      });
    }

    res.json({
      message: "تم حذف المنتج من السلة",
    });
  } catch (err) {
    console.error("DELETE CART ITEM ERROR:", err);

    res.status(500).json({
      message: "حدث خطأ أثناء حذف المنتج",
    });
  }
});


// DELETE /api/cart
// تفريغ السلة بالكامل
router.delete("/", auth, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!cart) {
      return res.json({
        message: "السلة بالفعل فارغة",
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    res.json({
      message: "تم تفريغ السلة",
    });
  } catch (err) {
    console.error("CLEAR CART ERROR:", err);

    res.status(500).json({
      message: "حدث خطأ أثناء تفريغ السلة",
    });
  }
});


module.exports = router;