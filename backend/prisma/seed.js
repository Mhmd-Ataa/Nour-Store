const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const products = [
  { name: "فستان نور الحريري", cat: "أزياء", price: 890, old: 1200, rating: 5, stock: 12 },
  { name: "عباية تطريز ذهبي", cat: "أزياء", price: 640, old: null, rating: 4, stock: 20 },
  { name: "طقم قلادة وأقراط لؤلؤ", cat: "إكسسوارات", price: 320, old: 420, rating: 5, stock: 8 },
  { name: "ساعة يد كلاسيك ذهبي", cat: "إكسسوارات", price: 750, old: null, rating: 4, stock: 15 },
  { name: "سيروم فيتامين سي", cat: "جمال", price: 210, old: 270, rating: 5, stock: 30 },
  { name: "طقم عناية بالبشرة الليلي", cat: "جمال", price: 480, old: null, rating: 4, stock: 18 },
  { name: "شمعة عطرية نور الليل", cat: "منزل", price: 150, old: null, rating: 5, stock: 40 },
  { name: "طقم فناجين قهوة فاخر", cat: "منزل", price: 380, old: 520, rating: 4, stock: 10 },
  { name: "حذاء كعب ساتان", cat: "أحذية", price: 560, old: null, rating: 4, stock: 14 },
  { name: "شنطة يد جلد طبيعي", cat: "أحذية", price: 920, old: 1150, rating: 5, stock: 6 },
  { name: "بلوزة حرير كم طويل", cat: "أزياء", price: 410, old: null, rating: 4, stock: 22 },
  { name: "إسورة ذهبية طبقات", cat: "إكسسوارات", price: 280, old: null, rating: 5, stock: 17 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate (order matters because of foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "مالكة المتجر",
      email: "admin@nour.com",
      password: bcrypt.hashSync("admin123", 10),
      role: "admin",
    },
  });

  await prisma.user.create({
    data: {
      name: "مريم عادل",
      email: "mariam@example.com",
      password: bcrypt.hashSync("123456", 10),
      role: "customer",
    },
  });

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`✅ Seeded ${products.length} products and 2 users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
