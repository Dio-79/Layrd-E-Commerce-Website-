'use client';

// Email verification. After sign-up (or logging in with an unverified email) Firebase
// emails a "verify your email" link. Once they've clicked it, "Continue" checks with
// Firebase and signs them in. Opening the link on another device or tab also works:
// they just log in again afterwards.
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useAuth } from '@/app/context/AuthContext';
import { homeForRole, type Role } from '@/lib/Auth/store';
import {
  clearPendingVerification,
  getPendingVerificationRaw,
  isEmailVerified,
  refreshIdToken,
  sendVerificationEmail,
  startSiteSession,
  type PendingVerification,
} from '@/lib/Auth/firebaseAuth';
import { ROUTES } from '@/lib/Routes/Routes';

// Swirl Logo Icon SVG
const SwirlIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor">
    <path
      d="M16 16c0-1.5 1.8-2.2 3-1.2 1.6 1.3.9 4-1 4.8-2.6 1.1-5.4-.9-5.6-3.7-.3-3.6 3-6.3 6.4-5.9 4.4.5 7 5 6 9.2-1.2 5-6.7 7.8-11.5 6.4C7.8 24 5 18.5 6.6 13.6 8.3 8.3 14 5.2 19.2 6.5"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const RESEND_SECONDS = 60;

// sessionStorage only exists in the browser; useSyncExternalStore reads it safely.
const subscribe = () => () => {};

export default function VerificationPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const pendingRaw = useSyncExternalStore(subscribe, getPendingVerificationRaw, () => null);
  const pending = useMemo<PendingVerification | null>(() => {
    try {
      return pendingRaw ? (JSON.parse(pendingRaw) as PendingVerification) : null;
    } catch {
      return null;
    }
  }, [pendingRaw]);

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending || checking) return;
    setError('');
    setMessage('');
    setChecking(true);
    try {
      // A fresh token carries the new "verified" status.
      const idToken = await refreshIdToken(pending.refreshToken);
      if (!(await isEmailVerified(idToken))) {
        setError("We haven't seen the click yet. Open the link in the email (check spam too), then press Continue.");
        return;
      }
      const user = await startSiteSession(idToken, pending.name);
      clearPendingVerification();
      await refresh();
      router.push(pending.next ?? homeForRole(user.role as Role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!pending) return;
    setError('');
    try {
      await sendVerificationEmail(pending.idToken);
      setMessage(`We sent a new link to ${pending.email}.`);
      setTimer(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the email. Please try again.");
    }
  };

  const formatTimer = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (!hydrated) return null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.glassCard}>
        <div className={styles.logoWrapper}>
          <SwirlIcon />
        </div>

        <h1 className={styles.title}>Verify your email</h1>

        {!pending ? (
          // Opened from the email link in a new tab: Firebase has already verified the email.
          <>
            <p className={styles.subtitle}>
              If you just clicked the link in our email, your email is verified. Log in to continue.
            </p>
            <Link href={ROUTES.login} className={styles.verifyBtn} style={{ display: 'block', textDecoration: 'none' }}>
              Log in
            </Link>
          </>
        ) : (
          <form onSubmit={handleContinue} style={{ width: '100%' }}>
            <p className={styles.subtitle}>
              We emailed a verification link to <strong>{pending.email}</strong>. Open it, then come back and press
              Continue.
            </p>

            {message && (
              <div role="status" style={{ color: '#d4f5d0', fontSize: 11, marginBottom: 12 }}>
                {message}
              </div>
            )}
            {error && (
              <div role="alert" style={{ color: '#ff8a80', fontSize: 11, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button type="submit" className={styles.verifyBtn} disabled={checking}>
              {checking ? 'Checking…' : "I've verified — continue"}
            </button>

            <div className={styles.timerText}>
              {timer > 0 ? `You can resend the email in ${formatTimer(timer)}` : "Didn't get it?"}
            </div>
            <div>
              <button type="button" onClick={handleResend} disabled={timer > 0} className={styles.resendBtn}>
                Resend email
              </button>
            </div>

            <div>
              <Link href={ROUTES.login} onClick={clearPendingVerification} className={styles.backLink}>
                Back to log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
