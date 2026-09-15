const router = require("express").Router();
const prisma = require("../prisma");
const { auth, requireAdmin } = require("../middleware/auth");
const cloudinary = require("../../cloudinary");
const upload = require("../middleware/upload");

// رفع الصورة إلى Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "nour-store/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

// GET /api/products
router.get("/", async (req, res) => {
  try {
    // الصفحة الحالية
    const page = Math.max(Number(req.query.page) || 1, 1);

    // عدد المنتجات في الصفحة
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 8, 1),
      50
    );

    // حساب عدد المنتجات التي سيتم تخطيها
    const skip = (page - 1) * limit;

    const where = {
  isActive: true,
};

// فلترة حسب التصنيف
// البحث عن المنتج - Global Search
if (req.query.search) {
  where.name = {
    contains: String(req.query.search).trim(),
    mode: "insensitive",
  };
}

// فلترة حسب التصنيف - تعمل فقط بدون Search
else if (req.query.category) {
  where.cat = String(req.query.category).trim();
}

    // جلب المنتجات + العدد الكلي في نفس الوقت
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: {
          id: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.product.count({
        where,
      }),
    ]);

    // إجمالي الصفحات
    const totalPages = Math.ceil(total / limit);

    res.json({
      products,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "حدث خطأ في الخادم",
    });
  }
});

// GET /api/products/admin
router.get("/admin", auth, requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "desc",
      },
    });

    res.json({ products });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "حدث خطأ في الخادم",
    });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "معرّف المنتج غير صحيح",
      });
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "المنتج غير موجود",
      });
    }

    res.json({ product });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "حدث خطأ في الخادم",
    });
  }
});

// POST /api/products
router.post(
  "/",
  auth,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    console.log("UPLOAD FILE:", req.file);
    try {
 const {
  name,
  cat,
  price,
  old,
  stock,
  rating,
  description
} = req.body;
      if (
        !name?.trim() ||
        !cat?.trim() ||
        price === undefined ||
        stock === undefined
      ) {
        return res.status(400).json({
          message: "بيانات المنتج غير مكتملة",
        });
      }

      const cleanName = name.trim();
      const cleanCat = cat.trim();
    
      const cleanPrice = Number(price);
      const cleanStock = Number(stock);

      const cleanOld =
        old === undefined || old === ""
          ? null
          : Number(old);

      const cleanRating =
        rating === undefined || rating === ""
          ? 5
          : Number(rating);

      if (
        !Number.isInteger(cleanPrice) ||
        cleanPrice < 0
      ) {
        return res.status(400).json({
          message: "السعر غير صحيح",
        });
      }

      if (
        !Number.isInteger(cleanStock) ||
        cleanStock < 0
      ) {
        return res.status(400).json({
          message: "الكمية غير صحيحة",
        });
      }

      if (
        cleanOld !== null &&
        (!Number.isInteger(cleanOld) || cleanOld < 0)
      ) {
        return res.status(400).json({
          message: "السعر القديم غير صحيح",
        });
      }

      if (
        !Number.isInteger(cleanRating) ||
        cleanRating < 1 ||
        cleanRating > 5
      ) {
        return res.status(400).json({
          message: "التقييم يجب أن يكون من 1 إلى 5",
        });
      }

      if (
        cleanName.length > 200 ||
        cleanCat.length > 100
      ) {
        return res.status(400).json({
          message: "بيانات المنتج طويلة جدًا",
        });
      }

    // لو الأدمن اختار صورة، نرفعها إلى Cloudinary
let imageUrl = null;

if (req.file) {
  console.log("Starting Cloudinary upload...");

  const result = await uploadToCloudinary(
    req.file.buffer
  );

  console.log("CLOUDINARY RESULT:", result);

  imageUrl = result.secure_url;

  console.log("IMAGE URL:", imageUrl);
}
      const product = await prisma.product.create({
        data: {
          name: cleanName,
          cat: cleanCat,
          price: cleanPrice,
          old: cleanOld,
          stock: cleanStock,
          rating: cleanRating,
                    description: description || null,

          image: imageUrl,
        },
      });

      res.status(201).json({ product });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "حدث خطأ في الخادم",
      });
    }
  }
);


// PUT /api/products/:id
router.put(
  "/:id",
  auth,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "معرّف المنتج غير صحيح",
        });
      }

    const {
      name,
      cat,
      price,
      old,
      stock,
      rating,
      description,
      isActive,
    } = req.body;

      const data = {};

      if (description !== undefined) {
  const cleanDescription = String(description).trim();

  if (cleanDescription.length > 2000) {
    return res.status(400).json({
      message: "وصف المنتج طويل جدًا",
    });
  }

  data.description = cleanDescription || null;
}

      if (name !== undefined) {
        const cleanName = String(name).trim();

        if (!cleanName || cleanName.length > 200) {
          return res.status(400).json({
            message: "اسم المنتج غير صحيح",
          });
        }

        data.name = cleanName;
      }

      if (cat !== undefined) {
        const cleanCat = String(cat).trim();

        if (!cleanCat || cleanCat.length > 100) {
          return res.status(400).json({
            message: "تصنيف المنتج غير صحيح",
          });
        }

        data.cat = cleanCat;
      }

      if (price !== undefined) {
        const cleanPrice = Number(price);

        if (
          !Number.isInteger(cleanPrice) ||
          cleanPrice < 0
        ) {
          return res.status(400).json({
            message: "السعر غير صحيح",
          });
        }

        data.price = cleanPrice;
      }

      if (old !== undefined) {
        if (old === "" || old === null) {
          data.old = null;
        } else {
          const cleanOld = Number(old);

          if (
            !Number.isInteger(cleanOld) ||
            cleanOld < 0
          ) {
            return res.status(400).json({
              message: "السعر القديم غير صحيح",
            });
          }

          data.old = cleanOld;
        }
      }

      if (stock !== undefined) {
        const cleanStock = Number(stock);

        if (
          !Number.isInteger(cleanStock) ||
          cleanStock < 0
        ) {
          return res.status(400).json({
            message: "الكمية غير صحيحة",
          });
        }

        data.stock = cleanStock;
      }

      if (rating !== undefined) {
        const cleanRating = Number(rating);

        if (
          !Number.isInteger(cleanRating) ||
          cleanRating < 1 ||
          cleanRating > 5
        ) {
          return res.status(400).json({
            message: "التقييم يجب أن يكون من 1 إلى 5",
          });
        }

        data.rating = cleanRating;
      }

      if (isActive !== undefined) {
        const cleanIsActive =
          isActive === true ||
          isActive === "true";

        data.isActive = cleanIsActive;
      }

      // لو الأدمن اختار صورة جديدة
     if (req.file) {
  console.log("Starting Cloudinary upload...");

  const result = await uploadToCloudinary(
    req.file.buffer
  );

  console.log("CLOUDINARY RESULT:", result);

  data.image = result.secure_url;

  console.log("IMAGE URL:", data.image);
}

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          message: "لا توجد بيانات لتعديلها",
        });
      }

      const product = await prisma.product.update({
        where: { id },
        data,
      });

      res.json({ product });
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({
          message: "المنتج غير موجود",
        });
      }

      console.error(err);

      res.status(500).json({
        message: "حدث خطأ في الخادم",
      });
    }
  }
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "معرّف المنتج غير صحيح",
        });
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      res.json({
        success: true,
        product,
      });
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({
          message: "المنتج غير موجود",
        });
      }

      console.error(err);

      res.status(500).json({
        message: "حدث خطأ في الخادم",
      });
    }
  }
);





module.exports = router;




