import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Verify admin authorization from request cookies.
 * Returns { payload } on success or { response } with 401/403 on failure.
 */
export async function requireAdmin(
  request: NextRequest,
  allowedRoles: string[] = ["ADMIN"]
): Promise<
  | { payload: AuthPayload; response?: never }
  | { payload?: never; response: NextResponse }
> {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return {
      response: NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      ),
    };
  }

  const payload = await verifyToken(token);
  if (!payload || !allowedRoles.includes(payload.role)) {
    return {
      response: NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      ),
    };
  }

  return { payload: payload as AuthPayload };
}
