// Firebase Authentication from the browser, through its REST API (no extra package).
// Firebase itself sends the emails: the "verify your email" link after sign-up and the
// password reset link. https://firebase.google.com/docs/reference/rest/auth
//
// After Firebase accepts the password, /api/auth/session turns the ID token into the
// site's httpOnly session cookie, and the server reads the role from Firestore.

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
// Set NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 to use the Auth emulator.
const EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
const BASE = EMULATOR
  ? `http://${EMULATOR}/identitytoolkit.googleapis.com/v1`
  : "https://identitytoolkit.googleapis.com/v1";
const TOKEN_URL = EMULATOR
  ? `http://${EMULATOR}/securetoken.googleapis.com/v1/token`
  : "https://securetoken.googleapis.com/v1/token";

const MESSAGES: Record<string, string> = {
  EMAIL_EXISTS: "An account with this email already exists. Log in instead.",
  INVALID_LOGIN_CREDENTIALS: "Incorrect email or password.",
  INVALID_PASSWORD: "Incorrect email or password.",
  EMAIL_NOT_FOUND: "Incorrect email or password.",
  USER_DISABLED: "This account has been disabled. Contact us for help.",
  INVALID_EMAIL: "Enter a valid email address.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Wait a few minutes and try again.",
  EXPIRED_OOB_CODE: "This link has expired. Request a new one.",
  INVALID_OOB_CODE: "This link is invalid or was already used. Request a new one.",
  INVALID_ID_TOKEN: "Your sign-in expired. Log in again.",
  TOKEN_EXPIRED: "Your sign-in expired. Log in again.",
};

const UNAUTHORIZED_DOMAIN = "This site isn't in Firebase's authorized domains.";

function friendly(code: string | undefined): string {
  if (!code) return "Something went wrong. Please try again.";
  if (/UNAUTHORIZED_DOMAIN|INVALID_CONTINUE_URI/.test(code)) return UNAUTHORIZED_DOMAIN;
  if (code.startsWith("WEAK_PASSWORD")) return "Choose a stronger password (at least 6 characters).";
  return MESSAGES[code.split(" ")[0]] ?? "Something went wrong. Please try again.";
}

async function call<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  if (!API_KEY) throw new Error("Firebase isn't set up (NEXT_PUBLIC_FIREBASE_API_KEY is missing).");
  const res = await fetch(`${BASE}/${endpoint}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(friendly(data.error?.message));
  return data;
}

/** Where Firebase's emails send people back to. */
const continueUrl = (path: string) => (typeof window === "undefined" ? undefined : `${window.location.origin}${path}`);

export interface FirebaseSignIn {
  idToken: string;
  refreshToken: string;
  email: string;
  emailVerified: boolean;
}

/** Creates the account, sets the display name and emails the verification link. */
export async function signUpWithEmail(email: string, password: string, name: string): Promise<FirebaseSignIn> {
  const created = await call<{ idToken: string; refreshToken: string }>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
  const updated = await call<{ idToken?: string; refreshToken?: string }>("accounts:update", {
    idToken: created.idToken,
    displayName: name,
    returnSecureToken: true,
  });
  const idToken = updated.idToken ?? created.idToken;
  await sendVerificationEmail(idToken);
  return { idToken, refreshToken: updated.refreshToken ?? created.refreshToken, email, emailVerified: false };
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseSignIn> {
  const { idToken, refreshToken } = await call<{ idToken: string; refreshToken: string }>(
    "accounts:signInWithPassword",
    { email, password, returnSecureToken: true }
  );
  return { idToken, refreshToken, email, emailVerified: await isEmailVerified(idToken) };
}

/**
 * A new ID token for the same user. Needed after they verify their email, because a
 * token keeps the email_verified value it had when it was issued.
 */
export async function refreshIdToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${TOKEN_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
  });
  const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: { message?: string } };
  if (!res.ok || !data.id_token) throw new Error(friendly(data.error?.message ?? "TOKEN_EXPIRED"));
  return data.id_token;
}

export async function isEmailVerified(idToken: string): Promise<boolean> {
  const { users } = await call<{ users?: { emailVerified?: boolean }[] }>("accounts:lookup", { idToken });
  return Boolean(users?.[0]?.emailVerified);
}

/**
 * Asks Firebase to send one of its emails. The link in it comes back to this site
 * (continueUrl) when the site's domain is in Firebase's authorized domains; if it
 * isn't, the email is sent without that link instead of failing.
 */
async function sendEmail(body: Record<string, unknown>, backTo: string) {
  try {
    await call("accounts:sendOobCode", { ...body, continueUrl: continueUrl(backTo) });
  } catch (err) {
    if (!(err instanceof Error && err.message === UNAUTHORIZED_DOMAIN)) throw err;
    await call("accounts:sendOobCode", body);
  }
}

/** Firebase emails a "verify your email" link. */
export async function sendVerificationEmail(idToken: string) {
  await sendEmail({ requestType: "VERIFY_EMAIL", idToken }, "/varifcationpage");
}

/** Firebase emails a password reset link (silently does nothing for unknown emails on new projects). */
export async function sendPasswordResetEmail(email: string) {
  await sendEmail({ requestType: "PASSWORD_RESET", email }, "/login");
}

/** For /reset-password: checks the code from the email link and returns its email. */
export async function checkResetCode(oobCode: string): Promise<string> {
  const { email } = await call<{ email: string }>("accounts:resetPassword", { oobCode });
  return email;
}

export async function resetPassword(oobCode: string, newPassword: string) {
  await call("accounts:resetPassword", { oobCode, newPassword });
}

/** For a verify-email link opened on this site: marks the email verified. */
export async function applyVerifyCode(oobCode: string) {
  await call("accounts:update", { oobCode });
}

/** Starts the site session (httpOnly cookie). Returns the user with their role. */
export async function startSiteSession(idToken: string, name?: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name }),
  });
  const data = (await res.json().catch(() => ({}))) as { user?: { role: string }; error?: string };
  if (!res.ok || !data.user) throw new Error(data.error ?? "Couldn't sign you in. Please try again.");
  return data.user;
}

// The account waiting for email verification (this tab only).
const PENDING_KEY = "layrd_pending_firebase";

export interface PendingVerification {
  idToken: string;
  refreshToken: string;
  email: string;
  name?: string;
  /** Page to open after verifying (from /login?next=...) */
  next?: string;
}

export function setPendingVerification(p: PendingVerification) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
}
export function getPendingVerificationRaw(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}
export function clearPendingVerification() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* nothing */
  }
}
