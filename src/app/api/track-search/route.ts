import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

let tablesEnsured = false;

async function ensureTables() {
  if (tablesEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS search_queries (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        query TEXT NOT NULL,
        user_id TEXT,
        session_id TEXT,
        service_type TEXT,
        result_count INTEGER DEFAULT 0,
        filters TEXT,
        country TEXT,
        city TEXT,
        is_ai_search BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS sq_query ON search_queries(query);
      CREATE INDEX IF NOT EXISTS sq_created ON search_queries(created_at);

      CREATE TABLE IF NOT EXISTS funnel_events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        event TEXT NOT NULL,
        user_id TEXT,
        session_id TEXT,
        service_id TEXT,
        service_type TEXT,
        metadata TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS fe_event ON funnel_events(event);
      CREATE INDEX IF NOT EXISTS fe_created ON funnel_events(created_at);

      CREATE TABLE IF NOT EXISTS user_activity (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ua_user ON user_activity(user_id);
      CREATE INDEX IF NOT EXISTS ua_created ON user_activity(created_at);
    `);
    tablesEnsured = true;
  } catch (e) {
    console.error("Failed to ensure analytics tables:", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { query, serviceType, resultCount, filters, country, city, isAiSearch } = body;

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) userId = (payload as any).userId || (payload as any).id || null;
      }
    } catch {}

    const sessionId =
      request.headers.get("x-session-id") ||
      request.cookies.get("session_id")?.value ||
      crypto.randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO search_queries (query, user_id, session_id, service_type, result_count, filters, country, city, is_ai_search)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      query, userId, sessionId, serviceType || null, resultCount || 0,
      filters ? JSON.stringify(filters) : null,
      country || null, city || null, isAiSearch || false
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track search error:", error);
    return NextResponse.json({ ok: true });
  }
}
