'use client';

import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useAuth } from '@/app/context/AuthContext';
import {
  clearPending,
  getPendingRaw,
  homeForRole,
  verifyTwoStepCode,
  type Session,
} from '@/lib/Auth/store';

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

// sessionStorage only exists in the browser. useSyncExternalStore reads it safely
// (null on the server, the real value in the browser) without setState inside an effect.
const subscribe = () => () => {};

export default function VerificationPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const pendingRaw = useSyncExternalStore(subscribe, getPendingRaw, () => null);
  const pending = useMemo<Session | null>(() => {
    try {
      return pendingRaw ? (JSON.parse(pendingRaw) as Session) : null;
    } catch {
      return null;
    }
  }, [pendingRaw]);

  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(42);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Only people who just logged in or signed up belong here.
  useEffect(() => {
    if (hydrated && !pending) router.replace('/login');
  }, [hydrated, pending, router]);

  // Focus the first box once the form is on screen.
  useEffect(() => {
    if (pending) inputRefs.current[0]?.focus();
  }, [pending]);

  // Countdown Timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP digit input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setError('');

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste a full 6-digit code into any box
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const next = Array(6).fill('');
    digits.split('').forEach((d, i) => (next[i] = d));
    setCode(next);
    setError('');
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending || verifying) return;

    if (timer <= 0) {
      setError('This code has expired. Please request a new one.');
      return;
    }

    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Enter all 6 digits.');
      return;
    }

    setVerifying(true);
    try {
      const ok = await verifyTwoStepCode(fullCode);
      if (!ok) {
        setError('That code is not valid. Try again.');
        setCode(Array(6).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      // Code accepted: now they are really signed in with their role (customer, admin, ...).
      signIn(pending);
      clearPending();
      router.push(homeForRole(pending.role));
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = () => {
    setTimer(60);
    setError('');
    setCode(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  // Format timer string as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Nothing to show on the server, or while redirecting someone with no pending login.
  if (!pending) return null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.glassCard}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <SwirlIcon />
        </div>

        <h1 className={styles.title}>Two-step verification</h1>
        <p className={styles.subtitle}>
          Enter the 6-digit code from your authenticator app (Microsoft Authenticator)
        </p>

        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          {/* 6 Digit Input Grid */}
          <div className={styles.codeGrid}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${idx + 1} of 6`}
                className={styles.codeInput}
              />
            ))}
          </div>

          {error && (
            <div role="alert" style={{ color: '#ff8a80', fontSize: 11, marginBottom: 12 }}>
              {error}
            </div>
          )}

          {/* Expiration Timer & Resend Button */}
          <div className={styles.timerText}>
            {timer > 0 ? `Code expires in ${formatTimer(timer)}` : 'Code expired'}
          </div>

          <div>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={timer > 0}
              className={styles.resendBtn}
            >
              Resend code
            </button>
          </div>

          {/* Action Buttons */}
          <button type="submit" className={styles.verifyBtn} disabled={verifying}>
            {verifying ? 'Verifying…' : 'Verify & continue'}
          </button>

          <div>
            <Link href="/login" onClick={clearPending} className={styles.backLink}>
              Back to log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}