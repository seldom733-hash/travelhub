export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// In-memory store for push subscriptions (use DB in production)
const pushSubscriptions = new Map<string, unknown[]>();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Некорректная подписка" }, { status: 400 });
    }

    // Store subscription
    const userSubs = pushSubscriptions.get(payload.userId) || [];
    // Avoid duplicates by endpoint
    const filtered = userSubs.filter((s) => {
      const sub = s as { endpoint?: string };
      return sub.endpoint !== subscription.endpoint;
    });
    filtered.push(subscription);
    pushSubscriptions.set(payload.userId, filtered);

    return NextResponse.json({ success: true, message: "Подписка сохранена" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const subs = pushSubscriptions.get(payload.userId) || [];
    return NextResponse.json({ subscriptions: subs, count: subs.length });
  } catch (error) {
    console.error("Push subscriptions fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
