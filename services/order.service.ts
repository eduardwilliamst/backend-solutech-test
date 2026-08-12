import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { createOrder, listOrdersByUser } from "@/repositories/order.repository";
import { findProductsByIds } from "@/repositories/product.repository";
import type { CreateOrderInput } from "@/validators/order.schema";

export async function createOrderForUser(userId: string, input: CreateOrderInput) {
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return prisma.$transaction(async (tx) => {
    const products = await findProductsByIds([...quantities.keys()], tx);
    const productMap = new Map(products.map((product) => [product.id, product]));

    let totalAmount = 0;
    const orderItems: { productId: string; quantity: number; priceAtPurchase: number }[] = [];

    for (const [productId, quantity] of quantities) {
      const product = productMap.get(productId);
      if (!product) {
        throw new NotFoundError(`Product ${productId} not found`);
      }
      if (product.stock < quantity) {
        throw new ConflictError(`Insufficient stock for product "${product.name}"`, {
          productId: product.id,
          available: product.stock,
          requested: quantity,
        });
      }

      const price = Number(product.price);
      totalAmount += price * quantity;
      orderItems.push({ productId, quantity, priceAtPurchase: price });
    }

    for (const item of orderItems) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, isDeleted: false, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        const product = productMap.get(item.productId);
        throw new ConflictError(`Insufficient stock for product "${product?.name ?? item.productId}"`, {
          productId: item.productId,
          requested: item.quantity,
        });
      }
    }

    return createOrder(tx, { userId, totalAmount, items: orderItems });
  });
}

export function getOrdersForUser(userId: string) {
  return listOrdersByUser(userId);
}
