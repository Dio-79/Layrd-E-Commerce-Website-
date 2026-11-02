// "Continue with Google" through Firebase Authentication (browser only).
// Firebase opens Google's sign-in popup; the ID token it returns starts the site
// session like any other login. Google accounts arrive with a verified email.
// Needs Google turned on in Firebase console → Authentication → Sign-in method,
// and the site's domain in Authentication → Settings → Authorized domains.
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from "firebase/auth";
import { startSiteSession } from "./firebaseAuth";

let auth: Auth | null = null;

function firebaseAuth(): Auth {
  if (auth) return auth;
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
  auth = getAuth(app);
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulator) connectAuthEmulator(auth, `http://${emulator}`, { disableWarnings: true });
  return auth;
}

const MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
  "auth/operation-not-allowed": "Google sign-in isn't turned on yet (Firebase console → Authentication → Sign-in method).",
  "auth/unauthorized-domain": "This site isn't in Firebase's authorized domains yet (Authentication → Settings).",
  "auth/account-exists-with-different-credential":
    "This email already has an account with a password. Log in with your email and password.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
};

/**
 * Signs in with Google and starts the site session. Returns the user's role, or
 * null if they closed the Google window.
 */
export async function continueWithGoogle(): Promise<{ role: string } | null> {
  const a = firebaseAuth();
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(a, provider);
    const idToken = await result.user.getIdToken();
    const user = await startSiteSession(idToken, result.user.displayName ?? undefined);
    // The site keeps its own session cookie; Firebase's copy in the browser isn't needed.
    await signOut(a).catch(() => undefined);
    return user;
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (code in MESSAGES) {
      if (!MESSAGES[code]) return null; // closed the popup
      throw new Error(MESSAGES[code]);
    }
    throw err instanceof Error && !code ? err : new Error("Google sign-in failed. Please try again.");
  }
}
