import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { handleApiError, success } from "@/lib/api-response";
import { createOrderForUser, getOrdersForUser } from "@/services/order.service";
import { createOrderSchema } from "@/validators/order.schema";

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const orders = await getOrdersForUser(userId);
    return success(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const input = createOrderSchema.parse(body);
    const order = await createOrderForUser(userId, input);
    return success(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
