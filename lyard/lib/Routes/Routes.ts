/**
 * One place for the route names, so every page links to the same URLs.
 * Next.js URLs are case-sensitive and come from the folder names under app/,
 * so each value here must match its folder exactly.
 */
export const ROUTES = {
  home: "/",
  cart: "/cart", //                      app/cart/page.tsx
  checkout: "/check-out", //             app/check-out/page.tsx
  confirmation: "/order-confirmation", // app/order-confirmation/page.tsx
} as const;