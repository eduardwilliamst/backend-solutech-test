import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { handleApiError, success } from "@/lib/api-response";
import { deleteProduct, getProductById, updateProduct } from "@/services/product.service";
import { updateProductSchema } from "@/validators/product.schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    requireAuth(request);
    const { id } = await params;
    const product = await getProductById(id);
    return success(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const input = updateProductSchema.parse(body);
    const product = await updateProduct(id, input);
    return success(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    requireAuth(request);
    const { id } = await params;
    await deleteProduct(id);
    return success({ id, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
