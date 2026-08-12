import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1d";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return secret;
}

export type JwtPayload = {
  userId: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
