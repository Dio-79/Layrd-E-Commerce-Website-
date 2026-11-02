'use client';

// /reset-password?oobCode=...: choose a new password from the emailed link.
// Firebase's own reset page also works; this one is used when the Firebase email
// template's action URL points at this site (see FIREBASE.md).
import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../varifcationpage/page.module.css';
import { checkResetCode, resetPassword } from '@/lib/Auth/firebaseAuth';
import { ROUTES } from '@/lib/Routes/Routes';

const noSubscribe = () => () => {};

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => null);
  const code = search === null ? null : new URLSearchParams(search).get('oobCode') ?? '';

  const [email, setEmail] = useState('');
  const [badLink, setBadLink] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const linkError = code === '' ? 'This page needs the link from your reset email.' : badLink;

  useEffect(() => {
    if (!code) return;
    checkResetCode(code)
      .then(setEmail)
      .catch((err) => setBadLink(err instanceof Error ? err.message : 'This link is invalid.'));
  }, [code]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError('Use at least 6 characters.');
    if (password !== confirm) return setError("The passwords don't match.");
    setError('');
    setSaving(true);
    try {
      await resetPassword(code!, password);
      router.push(`${ROUTES.login}?reset=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change the password.");
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>Choose a new password</h1>

        {linkError ? (
          <>
            <p className={styles.subtitle}>{linkError}</p>
            <Link
              href={ROUTES.forgotPassword}
              className={styles.verifyBtn}
              style={{ display: 'block', textDecoration: 'none' }}
            >
              Send a new link
            </Link>
          </>
        ) : !email ? (
          <p className={styles.subtitle} role="status">
            Checking your link…
          </p>
        ) : (
          <form onSubmit={submit} style={{ width: '100%' }} noValidate>
            <p className={styles.subtitle}>
              For <strong>{email}</strong>
            </p>
            <label htmlFor="new-password" className={styles.fieldLabel}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.textInput}
            />
            <label htmlFor="confirm-password" className={styles.fieldLabel}>
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={styles.textInput}
            />
            {error && (
              <div role="alert" style={{ color: '#ff8a80', fontSize: 11, margin: '8px 0' }}>
                {error}
              </div>
            )}
            <button type="submit" className={styles.verifyBtn} disabled={saving}>
              {saving ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
