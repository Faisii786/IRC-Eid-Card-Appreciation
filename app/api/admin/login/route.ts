import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PANEL_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "Admin password is not configured" }, { status: 500 });
  }

  const { password } = await req.json();
  if (String(password ?? "") !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "admin_auth",
    value: adminPassword,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
