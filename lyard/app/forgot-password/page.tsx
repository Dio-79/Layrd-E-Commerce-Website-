'use client';

// /forgot-password: Firebase emails a link to choose a new password.
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import styles from '../varifcationpage/page.module.css';
import { sendPasswordResetEmail } from '@/lib/Auth/firebaseAuth';
import { ROUTES } from '@/lib/Routes/Routes';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await sendPasswordResetEmail(clean);
      setSentTo(clean);
    } catch (err) {
      // Don't reveal whether an account exists; only show errors the user can act on.
      const message = err instanceof Error ? err.message : '';
      if (/valid email|Too many/.test(message)) setError(message);
      else setSentTo(clean);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>Reset your password</h1>

        {sentTo ? (
          <>
            <p className={styles.subtitle}>
              If there&apos;s an account for <strong>{sentTo}</strong>, we&apos;ve emailed it a link to choose a new
              password. Check your inbox (and spam).
            </p>
            <Link href={ROUTES.login} className={styles.verifyBtn} style={{ display: 'block', textDecoration: 'none' }}>
              Back to log in
            </Link>
          </>
        ) : (
          <form onSubmit={submit} style={{ width: '100%' }} noValidate>
            <p className={styles.subtitle}>Enter the email you signed up with and we&apos;ll send you a reset link.</p>
            <label htmlFor="reset-email" className={styles.fieldLabel}>
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.textInput}
            />
            {error && (
              <div role="alert" style={{ color: '#ff8a80', fontSize: 11, margin: '8px 0' }}>
                {error}
              </div>
            )}
            <button type="submit" className={styles.verifyBtn} disabled={sending}>
              {sending ? 'Sending…' : 'Email me a reset link'}
            </button>
            <div>
              <Link href={ROUTES.login} className={styles.backLink}>
                Back to log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
