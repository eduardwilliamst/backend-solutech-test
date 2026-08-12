import { NotFoundError } from "@/lib/errors";
import {
  createProduct as createProductRepo,
  findProductById,
  listProducts,
  softDeleteProduct,
  updateProduct as updateProductRepo,
} from "@/repositories/product.repository";
import type { CreateProductInput, ListProductQuery, UpdateProductInput } from "@/validators/product.schema";

export async function getProducts(query: ListProductQuery) {
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await listProducts({ skip, take: query.pageSize, search: query.search });

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getProductById(id: string) {
  const product = await findProductById(id);
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  return product;
}

export function createProduct(input: CreateProductInput) {
  return createProductRepo(input);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);
  return updateProductRepo(id, input);
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  return softDeleteProduct(id);
}
