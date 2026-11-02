# Payments

Checkout takes payment before an order is saved (Phase 3: FR-20, Use Cases 5 and 9).

| Method | How | Code |
|---|---|---|
| Credit / debit card | Square Web Payments SDK (card form) | `app/checkout/payments.tsx` → `POST /api/payments/square` |
| Apple Pay, Google Pay | Square Web Payments SDK (wallet buttons) | same as card |
| PayPal | PayPal JS SDK buttons + Orders API v2 | `POST /api/payments/paypal` |
| Interac e-Transfer | order saved as "awaiting e-Transfer"; an admin marks it paid | `POST /api/payments/etransfer`, `/confirm` |

A method only shows at checkout when its settings are in `.env.local`.

## How a Square payment works

1. The browser turns the card (or wallet) into a one-time token. Card numbers never reach our server.
2. `/api/payments/square` re-prices the order from Firestore (product prices, sizes, promo codes, 5% GST),
   so the browser can't change the amount.
3. It creates the payment with `autocomplete: false` (authorized, not taken yet). The order number is the
   idempotency key, so a retry never charges twice.
4. It saves the order to Firestore. If that fails, the payment is **cancelled**.
5. It calls **Complete Payment** (`POST /v2/payments/{payment_id}/complete`) to take the money.
   If that call fails, the order is marked `payment.status: "authorized"`; complete it from the Square
   Dashboard within 7 days or Square cancels it.

Declined cards show "Payment declined…", nothing is saved, and the cart is kept.

PayPal works the same way: our server creates the PayPal order for the server total, the buyer approves it,
then the server captures it and checks the captured amount matches before saving the order.

## Settings (`lyard/.env.local`)

```ini
# Square: developer.squareup.com → your app → Sandbox (switch to Production when going live)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-...
NEXT_PUBLIC_SQUARE_LOCATION_ID=L...
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=EAAA...            # secret: server only

# PayPal: developer.paypal.com → Apps & Credentials → Sandbox
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...               # secret: server only
PAYPAL_ENVIRONMENT=sandbox

# Interac e-Transfer
NEXT_PUBLIC_ETRANSFER_EMAIL=payments@example.com
```

Restart `npm run dev` after changing `.env.local`. Never commit it (it's in `.gitignore`).

**Apple Pay** also needs the website's domain registered in the Square Developer Dashboard
(Apple Pay → Add domain), and only shows in Safari on Apple devices. **Google Pay** works in Chrome.

## Testing

- Square sandbox test cards: https://developer.squareup.com/docs/devtools/sandbox/payments
  (e.g. Visa `4111 1111 1111 1111`, any future expiry, CVV `111`, postal code `12345`).
- PayPal sandbox: log in with a sandbox *personal* account from developer.paypal.com → Sandbox accounts.
- Automated tests: `node scripts/test-with-emulators.mjs` (`tests/payments.test.ts`, `tests/payment-clients.test.ts`;
  Square and PayPal are replaced with test doubles there).

## Admin

`/live/orders` (signed in as an admin) shows each order's payment. e-Transfer orders have a **Mark paid**
button for when the money arrives.
