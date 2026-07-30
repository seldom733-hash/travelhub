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
    `);
    tablesEnsured = true;
  } catch (e) {
    console.error("Failed to ensure funnel table:", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { event, serviceId, serviceType, metadata } = body;

    if (!event) {
      return NextResponse.json({ error: "event is required" }, { status: 400 });
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
      `INSERT INTO funnel_events (event, user_id, session_id, service_id, service_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      event, userId, sessionId, serviceId || null, serviceType || null,
      metadata ? JSON.stringify(metadata) : null
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track funnel error:", error);
    return NextResponse.json({ ok: true });
  }
}
