import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

let tableEnsured = false;

async function ensurePageViewsTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS page_views (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        path TEXT NOT NULL,
        service_id TEXT,
        service_type TEXT,
        user_id TEXT,
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        country TEXT,
        city TEXT,
        device TEXT,
        is_partner BOOLEAN DEFAULT false,
        duration INTEGER,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_pv_service_id ON page_views(service_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_pv_user_id ON page_views(user_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_pv_session_id ON page_views(session_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_pv_created_at ON page_views(created_at)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_pv_service_type ON page_views(service_type)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path)`);
    tableEnsured = true;
  } catch (e) {
    console.error("Failed to ensure page_views table:", e);
  }
}

function detectDevice(ua: string | null): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

export async function POST(request: NextRequest) {
  try {
    await ensurePageViewsTable();

    const body = await request.json();
    const { path, serviceId, serviceType, duration, referrer } = body;

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    // Try to get user info
    let userId: string | null = null;
    let isPartner = false;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          userId = (payload as any).userId || (payload as any).id || null;
          isPartner = (payload as any).role === "PARTNER";
        }
      }
    } catch {}

    // Session ID from cookie or header
    const sessionId =
      request.headers.get("x-session-id") ||
      request.cookies.get("session_id")?.value ||
      crypto.randomUUID();

    const ua = request.headers.get("user-agent");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    await prisma.$executeRawUnsafe(
      `INSERT INTO page_views (path, service_id, service_type, user_id, session_id, ip_address, user_agent, referrer, device, is_partner, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      path,
      serviceId || null,
      serviceType || null,
      userId,
      sessionId,
      ip,
      ua,
      referrer || null,
      detectDevice(ua),
      isPartner,
      duration || null
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track view error:", error);
    return NextResponse.json({ ok: true }); // Don't break UX on tracking errors
  }
}
