import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@solutech.test" },
    update: {},
    create: {
      email: "admin@solutech.test",
      passwordHash,
      name: "Admin Solutech",
    },
  });

  console.log(`Seeded user: ${user.email}`);

  const products = [
    { name: "Wireless Mouse", description: "Ergonomic 2.4GHz wireless mouse", price: 150000, stock: 50 },
    { name: "Mechanical Keyboard", description: "Hot-swappable mechanical keyboard", price: 750000, stock: 30 },
    { name: "USB-C Hub", description: "7-in-1 USB-C hub with HDMI", price: 320000, stock: 40 },
    { name: "Laptop Stand", description: "Adjustable aluminum laptop stand", price: 210000, stock: 25 },
    { name: "Webcam 1080p", description: "Full HD webcam with autofocus", price: 480000, stock: 20 },
  ];

  const existingCount = await prisma.product.count();
  if (existingCount === 0) {
    await prisma.product.createMany({ data: products });
    console.log(`Seeded ${products.length} products`);
  } else {
    console.log(`Skipped product seeding, ${existingCount} product(s) already exist`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
