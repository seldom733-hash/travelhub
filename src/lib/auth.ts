import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

function getJWTSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    throw new Error(
      "[Auth] JWT_SECRET env variable is required. " +
      "Set it in .env — see .env.example for details."
    );
  }
  return new TextEncoder().encode(raw);
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function createToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJWTSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Extract the authenticated session user (ADMIN/MODERATOR/PARTNER/BUYER)
 * from the request's auth cookie. Returns null when unauthenticated.
 */
export async function getSessionUser(req: NextRequest): Promise<{ userId: string; email: string; role: string } | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
