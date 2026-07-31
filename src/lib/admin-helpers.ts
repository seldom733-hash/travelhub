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

/**
 * Safely parse pagination params from URL search params.
 * Returns validated page (>=1) and limit (1..100) with defaults.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; skip: number } {
  const rawPage = parseInt(searchParams.get("page") || String(defaults.page ?? 1), 10);
  const rawLimit = parseInt(searchParams.get("limit") || String(defaults.limit ?? 20), 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, 100) : 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
