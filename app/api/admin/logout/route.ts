import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin", req.url));
  response.cookies.set({
    name: "admin_auth",
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
