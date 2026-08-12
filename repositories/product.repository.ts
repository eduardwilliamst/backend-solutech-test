import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type DbClient = Prisma.TransactionClient | typeof prisma;

export function listProducts(params: { skip: number; take: number; search?: string }) {
  const where: Prisma.ProductWhereInput = {
    isDeleted: false,
    ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
  };

  return Promise.all([
    prisma.product.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);
}

export function findProductById(id: string, db: DbClient = prisma) {
  return db.product.findFirst({ where: { id, isDeleted: false } });
}

export function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export function softDeleteProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { isDeleted: true } });
}
