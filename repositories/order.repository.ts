import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function createOrder(
  db: Prisma.TransactionClient,
  data: { userId: string; totalAmount: number; items: { productId: string; quantity: number; priceAtPurchase: number }[] }
) {
  return db.order.create({
    data: {
      userId: data.userId,
      totalAmount: data.totalAmount,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        })),
      },
    },
    include: { items: true },
  });
}

export function listOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}
