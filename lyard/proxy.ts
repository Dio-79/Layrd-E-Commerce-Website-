// Next.js proxy (runs before each page request).
// Some links in the code use URLs that don't match the folder names, and
// Next.js URLs are case-sensitive (folder "Cart" is /Cart, not /cart).
// Instead of editing those files, this sends each old URL to the real page.
import { NextResponse, type NextRequest } from "next/server";

const ALIASES: Record<string, string> = {
  "/cart": "/Cart", // ROUTES.cart, checkout's "Return to Cart"
  "/drinks": "/Drinks", // ROUTES.drinks (header "Drinks" link)
  "/order-confirmation": "/OrderConfirmation", // where checkout goes after placing an order
  "/admin": "/User/Admin", // admin role's home page
  "/wholesale": "/User/WholesSale", // wholesale role's home page and "Apply for Wholesale"
};

export function proxy(request: NextRequest) {
  const target = ALIASES[request.nextUrl.pathname];
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/cart", "/drinks", "/order-confirmation", "/admin", "/wholesale"],
};
