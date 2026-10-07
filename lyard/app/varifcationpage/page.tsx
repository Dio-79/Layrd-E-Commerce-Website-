'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './verification.module.css';

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

export default function VerificationPage() {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(42);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    alert(`Verifying Code: ${fullCode}`);
  };

  const handleResendCode = () => {
    setTimer(60);
    setCode(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  // Format timer string as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={styles.codeInput}
              />
            ))}
          </div>

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
          <button type="submit" className={styles.verifyBtn}>
            Verify & continue
          </button>

          <div>
            <Link href="/login" className={styles.backLink}>
              Back to log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}