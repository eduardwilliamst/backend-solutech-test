import { NextRequest } from "next/server";
import { handleApiError, success } from "@/lib/api-response";
import { login } from "@/services/auth.service";
import { loginSchema } from "@/validators/auth.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const result = await login(input);
    return success(result);
  } catch (error) {
    return handleApiError(error);
  }
}
