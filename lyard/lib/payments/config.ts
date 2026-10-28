// Which payment methods are switched on, from the settings in .env.local.
// Safe to import in the browser: it only reads NEXT_PUBLIC_ values.

export const CURRENCY = "CAD";
export const COUNTRY = "CA";

export const square = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? "",
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "",
  sandbox: (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT ?? "sandbox") !== "production",
};

export const paypal = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
};

export const etransferEmail = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL ?? "";

export const enabled = {
  /** Card, Apple Pay and Google Pay all go through Square */
  square: Boolean(square.applicationId && square.locationId),
  paypal: Boolean(paypal.clientId),
  etransfer: Boolean(etransferEmail),
};

export const squareScriptUrl = square.sandbox
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";
