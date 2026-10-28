/**
 * One place for the route names, so every link points at the same URLs.
 * Next.js URLs are case-sensitive and come from the folder names under app/,
 * so each value here must match its folder exactly.
 */
export const ROUTES = {
  home: "/",
  main: "/Mainpage", //                 app/Mainpage/page.tsx
  drinks: "/drinks", //                 app/drinks/page.tsx
  cakeInACan: "/products", //           app/products/page.tsx
  bundles: "/Bundle", //                app/Bundle/page.tsx
  eventOrder: "/Eventorder", //         app/Eventorder/page.tsx
  search: "/Search", //                 app/Search/page.tsx
  cart: "/Cart", //                     app/cart/page.tsx
  checkout: "/check-out", //            app/check-out/page.tsx
  confirmation: "/OrderConfirmation", // app/OrderConfirmation/page.tsx
  settings: "/Setting", //              app/Setting/page.tsx
} as const;