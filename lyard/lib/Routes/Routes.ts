/**
 * One place for the route names, so every link points at the same URLs.
 * Next.js URLs are case-sensitive and come from the folder names under app/,
 * so each value here must match its folder exactly.
 */
export const ROUTES = {
  home: "/",
  main: "/Mainpage", //                 app/Mainpage/page.tsx
  drinks: "/Drinks", //                 app/Drinks/page.tsx
  cakeInACan: "/products", //           app/products/page.tsx
  bundles: "/Bundle", //                app/Bundle/page.tsx
  eventOrder: "/Eventorder", //         app/Eventorder/page.tsx
  search: "/Search", //                 app/Search/page.tsx
  cart: "/Cart", //                     app/Cart/page.tsx
  checkout: "/checkout", //             app/checkout/page.tsx
  confirmation: "/OrderConfirmation", // app/OrderConfirmation/page.tsx
  settings: "/Setting", //              app/Setting/page.tsx
  login: "/login", //                   app/login/page.tsx
  signup: "/Signup", //                 app/Signup/page.tsx
  verify: "/varifcationpage", //        app/varifcationpage/page.tsx
  forgotPassword: "/forgot-password", // app/forgot-password/page.tsx
  resetPassword: "/reset-password", //  app/reset-password/page.tsx
} as const;

/** Why a page sent someone to the login page; the login page shows the matching message. */
export const LOGIN_REASONS = {
  "account:manage": "Log in to see your account settings.",
  "checkout:purchase": "Log in or create an account to place an order. Guests can browse but can't buy.",
  "events:preorder": "Log in or create an account to place an event order.",
  "admin:portal": "Log in with an admin account to open the admin portal.",
  "wholesale:portal": "Log in with a wholesale account to open the wholesale portal.",
} as const;

/** /login URL that comes back to `next` after logging in. */
export function loginUrl(next?: string, reason?: string) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  return query ? `${ROUTES.login}?${query}` : ROUTES.login;
}

/** Only follow `next` if it is a page on this site. */
export function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
