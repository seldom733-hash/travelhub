export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Вы вышли из аккаунта" });
  response.cookies.delete("token");
  return response;
}
