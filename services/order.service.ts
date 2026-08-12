import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { createOrder, listOrdersByUser } from "@/repositories/order.repository";
import type { CreateOrderInput } from "@/validators/order.schema";

export async function createOrderForUser(userId: string, input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const productIds = input.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    let totalAmount = 0;
    const orderItems: { productId: string; quantity: number; priceAtPurchase: number }[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new ConflictError(`Insufficient stock for product "${product.name}"`, {
          productId: product.id,
          available: product.stock,
          requested: item.quantity,
        });
      }

      const price = Number(product.price);
      totalAmount += price * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, priceAtPurchase: price });
    }

    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return createOrder(tx, { userId, totalAmount, items: orderItems });
  });
}

export function getOrdersForUser(userId: string) {
  return listOrdersByUser(userId);
}
