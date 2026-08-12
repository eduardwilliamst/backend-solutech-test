import { NextRequest } from "next/server";
import { UnauthorizedError } from "./errors";
import { verifyToken } from "./jwt";

export function requireAuth(request: NextRequest): { userId: string } {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    return { userId: payload.userId };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
