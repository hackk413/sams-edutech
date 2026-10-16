import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL("/auth/login?reset=1", request.url);
  const response = NextResponse.redirect(url);
  const cookies = request.cookies.getAll();
  for (const cookie of cookies) {
    if (cookie.name.includes("sb-") || cookie.name.includes("auth")) {
      response.cookies.delete(cookie.name);
    }
  }
  return response;
}
