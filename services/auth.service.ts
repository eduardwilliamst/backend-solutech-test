import bcrypt from "bcryptjs";
import { UnauthorizedError } from "@/lib/errors";
import { signToken } from "@/lib/jwt";
import { findUserByEmail } from "@/repositories/user.repository";
import type { LoginInput } from "@/validators/auth.schema";

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = signToken({ userId: user.id });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}
