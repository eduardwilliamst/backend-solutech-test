import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { handleApiError, success } from "@/lib/api-response";
import { createProduct, getProducts } from "@/services/product.service";
import { createProductSchema, listProductQuerySchema } from "@/validators/product.schema";

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    const { searchParams } = new URL(request.url);
    const query = listProductQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    const result = await getProducts(query);
    return success(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    const body = await request.json();
    const input = createProductSchema.parse(body);
    const product = await createProduct(input);
    return success(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
