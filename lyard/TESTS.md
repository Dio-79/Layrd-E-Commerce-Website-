# Layrd Firebase tests

Double-click `run-tests.bat` to run both parts (start the site first for part 2).

## 1. Automated tests: 91 tests, throwaway emulators

`node scripts/test-with-emulators.mjs` starts temporary Firebase emulators
(ports 8085 and 9199), runs the tests, and shuts them down. They never touch
your real project. Last run (2026-11-20): **91 passed, 0 failed**.

**Security rules** (`tests/rules.test.ts`): what a browser may do directly in Firestore
- anyone, even signed out, can read the catalog
- nobody can change products from the browser
- a signed-in user can read their own profile
- a user cannot read someone else's profile
- signed-out visitors cannot read profiles
- a user cannot make themselves an admin
- the browser cannot read orders, not even your own
- the browser cannot create or change orders
- preorders are not readable from the browser

**Sign-in sessions** (`tests/auth.test.ts`)
- is signed out without a session cookie
- rejects a missing or fake sign-in token
- a new account gets a session, a profile and the customer role
- the role comes from Firestore, not from the browser
- a tampered session cookie is rejected
- logout clears the session cookie

**Products** (`tests/products.test.ts`)
- returns an empty list before the catalog is loaded
- returns every product from Firestore, sorted by productID
- returns the data as stored (a price change in Firestore shows up)

**Orders** (`tests/orders.test.ts`)
- saves a guest order to Firestore
- links the order to the signed-in customer
- rejects bad orders (bad number, no items, bad email, empty body)
- won't save the same order number twice
- listing orders needs a signed-in user
- customers only see their own orders; admins see all

**Remaining MVP stories 3, 5 and 8** (`tests/mvp.test.ts`, added 2026-11-20)
- story 3: revenue, ingredient cost, profit and margin per product (wholesale discounts shared across lines)
- story 3: cancelled orders and orders outside the chosen dates are left out
- story 3: CSV cells are escaped and spreadsheet formulas are defused
- story 3: admins download the sales and ingredient cost CSVs; signed out gets 401, customers 403; bad dates refused
- story 3: admins set an ingredient cost per product; the shop never sees it
- story 5: average rating and short public names ("Abel F.")
- story 5: customers rate and edit their review; guests read; "verified purchase" is decided on the server
- story 5: customers remove their own review; only admins remove other people's
- story 8: tax documents must be a real PDF, JPG or PNG under 700 KB
- story 8: wholesale buyers upload; GST stays until an admin approves; then orders are GST free; only admins and the owner can open the file
- story 8: an expired exemption no longer counts
- story 8: quote totals, savings and expiry dates
- story 8: request a quote, admin prices it, buyer accepts and it becomes a wholesale order at the agreed prices (once only)
- story 8: expired prices can't be accepted; buyers can decline; admins can turn a request down

## 2. Live check on your real project: 8 checks

`npx tsx --env-file=.env.local scripts/smoke-real.mts`, with the site running.
Uses a throwaway account and order and deletes both at the end.
- products are in Firestore
- the site serves those products
- Firebase Auth accepts a new email/password account
- the site starts a session and gives the customer role
- a checkout order is saved to Firestore under that user
- deployed rules: anyone can read products
- deployed rules: the browser can't read orders, even its own
- deployed rules: a user can't make themselves admin
