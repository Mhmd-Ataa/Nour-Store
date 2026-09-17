const router = require("express").Router();
const prisma = require("../prisma");
const { auth, optionalAuth, requireAdmin } = require("../middleware/auth");
const ORDER_STATUSES = ["بانتظار الدفع", "قيد المعالجة", "تم الشحن", "تم التسليم", "ملغي"];
const ORDER_LIMIT = 3;
const ORDER_WINDOW_MS = 30 * 60 * 1000;
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    ""
  );
}

// Add a pre-formatted Arabic date string so the frontend doesn't need to change.
function serializeOrder(o) {
  return {
    ...o,

    items: o.items?.map((item) => ({
      ...item,
      image: item.product?.image || null,
      cat: item.product?.cat || null,
    })),

    date: o.createdAt.toLocaleDateString("ar-EG"),
  };
}
// POST /api/orders  body: { items: [{id, qty}], paymentMethod: "cod" | "card" }
// Stock is checked and reserved (decremented) atomically at order creation,
// for both payment methods, to avoid overselling. If a card payment later
// fails, the webhook releases the reserved stock back.
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      items,
      customerName,
      phone,
      address,
      city,
      governorate,
      notes,
    } = req.body;
    const clientIp = getClientIp(req);

    const windowStart = new Date(Date.now() - ORDER_WINDOW_MS);

    const recentOrders = await prisma.order.count({
      where: req.user
        ? {
          userId: req.user.id,
          createdAt: {
            gte: windowStart,
          },
        }
        : {
          ipAddress: clientIp,
          createdAt: {
            gte: windowStart,
          },
        },
    });

    if (recentOrders >= ORDER_LIMIT) {
      return res.status(429).json({
        message: "لقد وصلت للحد الأقصى للطلبات. حاول مرة أخرى بعد 30 دقيقة.",
      });
    }
    const paymentMethod = req.body.paymentMethod;

    if (!["cod", "card"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "طريقة الدفع غير صحيحة",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "السلة فاضية" });
    }
    if (items.length > 30) {
      return res.status(400).json({
        message: "عدد المنتجات في الطلب كبير جدًا",
      });
    }
    const productIds = items.map((item) => Number(item.id));

    if (new Set(productIds).size !== productIds.length) {
      return res.status(400).json({
        message: "لا يمكن تكرار نفس المنتج في الطلب",
      });
    }
    const cleanPhone = phone?.trim() || "";

    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return res.status(400).json({
        message: "من فضلك أدخل رقم موبايل مصري صحيح",
      });
    }

    const cleanName = req.user
      ? req.user.name.trim()
      : customerName?.trim() || "";
    const cleanAddress = address?.trim() || "";
    const cleanCity = city?.trim() || "";
    const cleanGovernorate = governorate?.trim() || "";
    const cleanNotes = notes?.trim() || "";

    if (!cleanName) {
      return res.status(400).json({
        message: "الاسم بالكامل مطلوب",
      });
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        message: "الاسم يجب أن يكون بين 2 و100 حرف",
      });
    }

    if (!cleanAddress) {
      return res.status(400).json({
        message: "العنوان مطلوب",
      });
    }

    if (cleanAddress.length > 300) {
      return res.status(400).json({
        message: "العنوان طويل جدًا",
      });
    }

    if (cleanCity.length > 100) {
      return res.status(400).json({
        message: "اسم المدينة طويل جدًا",
      });
    }

    if (cleanGovernorate.length > 100) {
      return res.status(400).json({
        message: "اسم المحافظة طويل جدًا",
      });
    }

    if (cleanNotes.length > 500) {
      return res.status(400).json({
        message: "الملاحظات طويلة جدًا",
      });
    }

 const order = await prisma.$transaction(
  async (tx) => {
    let total = 0;
    const orderItemsData = [];

    for (const ci of items) {
      const productId = Number(ci.id);
      const qty = Number(ci.qty);

      if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("معرّف المنتج غير صحيح");
      }

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error("كمية المنتج غير صحيحة");
      }

      const product = await tx.product.findFirst({
        where: {
          id: productId,
          isActive: true,
        },
      });

      if (!product) {
        throw new Error("المنتج غير موجود أو غير متاح");
      }

      if (product.stock < qty) {
        throw new Error(`الكمية المطلوبة من ${product.name} غير متاحة`);
      }

      total += product.price * qty;

      orderItemsData.push({
        productId: product.id,
        name: product.name,
        cat: product.cat,
        price: product.price,
        qty,
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: {
            decrement: qty,
          },
        },
      });
    }

    if (orderItemsData.length === 0) {
      throw new Error("لا توجد منتجات في الطلب");
    }

    return tx.order.create({
      data: {
        userId: req.user ? req.user.id : null,
        ipAddress: clientIp,

        customerName: req.user
          ? req.user.name
          : cleanName,

        phone: cleanPhone,
        address: cleanAddress,
        city: cleanCity,
        governorate: cleanGovernorate,
        notes: cleanNotes,

        total,

        status:
          paymentMethod === "card"
            ? "بانتظار الدفع"
            : "قيد المعالجة",

        paymentMethod,
        paid: false,

        items: {
          create: orderItemsData,
        },
      },

      include: {
        items: true,
      },
    });
  },
  {
    timeout: 10000,
    maxWait: 5000,
  }
);

   if (req.user) {
  await prisma.cartItem.deleteMany({
    where: { cart: { userId: req.user.id } },
  });
}

    res.status(201).json({
      order: serializeOrder(order),
    });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({
      message: err.message || "تعذر إنشاء الطلب",
    });
  }
});
// GET /api/orders/mine

router.get("/mine", auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },

      include: {
        items: {
          include: {
            product: true
          }
        }
      },

      orderBy: { createdAt: "desc" },
    });

    res.json({ orders: orders.map(serializeOrder) });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});


// GET /api/orders/all (admin only)

router.get("/all", auth, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({

      include: {
        items: {
          include: {
            product: true
          }
        }
      },

      orderBy: { createdAt: "desc" },
    });

    res.json({ orders: orders.map(serializeOrder) });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

// PATCH /api/orders/:id/status (admin only) body: { status }
// Cancelling an order automatically restores the stock that was reserved for it.
router.patch("/:id/status", auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "حالة الطلب غير صحيحة" });
    }
    const id = Number(req.params.id);
    const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return res.status(404).json({ message: "الطلب غير موجود" });

const order = await prisma.$transaction(
  async (tx) => {
    // من حالة نشطة → ملغي
    // نرجع الكمية للمخزون
    if (status === "ملغي" && existing.status !== "ملغي") {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.qty,
            },
          },
        });
      }
    }

    // من ملغي → حالة نشطة
    // نحجز الكمية مرة أخرى ونخصمها من المخزون
    if (existing.status === "ملغي" && status !== "ملغي") {
      for (const item of existing.items) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.qty,
            },
          },
          data: {
            stock: {
              decrement: item.qty,
            },
          },
        });

        if (updatedProduct.count === 0) {
          throw new Error(
            `الكمية المطلوبة من المنتج غير متاحة حاليًا`
          );
        }
      }
    }

    return tx.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  },
  {
    timeout: 10000,
    maxWait: 5000,
  }
);

    res.json({ order: serializeOrder(order) });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "الطلب غير موجود" });
    console.error(err);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});


// DELETE /api/orders/:id (admin only)
// Used to remove a completed/delivered order from the admin dashboard.
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "معرّف الطلب غير صحيح",
      });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "الطلب غير موجود",
      });
    }
    if (existing.status !== "تم التسليم") {
  return res.status(400).json({
    message: "لا يمكن حذف الطلب إلا بعد أن تكون حالته تم التسليم",
  });
}

    await prisma.order.delete({
      where: { id },
    });

    res.json({
      message: "تم حذف الطلب بنجاح",
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "الطلب غير موجود",
      });
    }

    console.error(err);

    res.status(500).json({
      message: "حدث خطأ في الخادم",
    });
  }
});



module.exports = router;
