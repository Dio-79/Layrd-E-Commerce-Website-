
import { NextResponse, type NextRequest } from "next/server";

const ALIASES: Record<string, string> = {
  "/cart": "/Cart",
  "/drinks": "/Drinks",
  "/order-confirmation": "/OrderConfirmation",

  // Admin Dashboard
  "/admin": "/admin/dashboard",

  // Wholesale Dashboard
  "/wholesale": "/wholesale/dashboard",
};

export function proxy(request: NextRequest) {
  const target = ALIASES[request.nextUrl.pathname];

  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = target;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/cart",
    "/drinks",
    "/order-confirmation",
    "/admin",
    "/wholesale",
  ],
};
