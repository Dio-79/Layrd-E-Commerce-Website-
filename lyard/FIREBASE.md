# Layrd on your Firebase project (this PC)

Firebase project: **Layrd E-Commerce** (`layrd-ecommerce-abel`) on your Google
account. Email/Password sign-in is on, Firestore is in `nam5`, and
`firestore.rules` is deployed.

**No existing file was changed.** Every file that is on GitHub `main` is
byte-for-byte the same; everything below is new files only. Even
`package.json` is unchanged: the extra packages are installed with
`npm install --no-save` (`scripts/install-extras.cmd`).

## Start the site

Double-click `start-layrd.bat` → http://localhost:3000

## What the new files do

| File | Why |
|---|---|
| `app/api/products/route.ts` | `GET /api/products`: the catalog from Firestore `products` |
| `app/api/auth/session`, `me`, `logout` | Firebase sign-in → httpOnly session cookie; `/api/auth/me` is what `app/context/AuthContext.tsx` already calls |
| `app/api/orders/route.ts` | `POST` saves a checkout order to Firestore `orders`; `GET` lists your orders (admins: all) |
| `lib/firebase/admin.ts`, `lib/server/session.ts` | Firebase Admin SDK + session helpers for those routes |
| `proxy.ts` | Sends `/cart`, `/drinks`, `/order-confirmation`, `/admin`, `/wholesale` to the real pages (links in the code use those URLs, folders are `Cart`, `Drinks`, …) |
| `firebase.json`, `.firebaserc`, `firestore.rules` | Project, Email/Password provider and security rules |
| `scripts/*`, `tests/*`, `run-tests.bat` | Loading data, admin roles, tests |

## Not connected yet (would need edits to existing files)

The pages themselves are still exactly as on `main`, so:
- the **login** and **sign-up** forms are still the built-in demo (`app/login/loginapi.ts`,
  `app/Signup/SignupApi.tsx` don't call a server);
- **checkout** keeps the order in the browser (`placeOrder` in `lib/checkout/checkoutStore.ts`)
  instead of calling `/api/orders`;
- the shop shows the products from `lib/catelog/data.ts`, not `/api/products`;
- bundle and event preorders are still saved to `.data/*.json`.

The Firebase side for all of these is ready and tested; connecting each one is a
small edit to the file named above.

## Commands (run in this folder)

| Command | Does |
|---|---|
| `npx tsx --env-file=.env.local scripts/seed-real.mts` | Copies the catalog from `lib/catelog/data.ts` into Firestore `products` |
| `npx tsx --env-file=.env.local scripts/make-admin.mts you@example.com` | Makes an existing account an admin (role in Firestore `users`) |
| `node scripts/test-with-emulators.mjs` | The automated tests (throwaway emulators) |
| `npx tsx --env-file=.env.local scripts/smoke-real.mts` | Live check against your real project (site must be running) |

Settings are in `.env.local` (ignored by git). The server key is at
`C:\Users\abelf\.layrd\firebase-service-account.json`, outside the repo; never share it.
