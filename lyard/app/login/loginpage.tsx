'use client';


import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import styles from './login.module.css';
import { LoginForms as submitLoginForm } from './loginapi';

const schema = yup.object({
  email: yup.string().trim().email('Invalid email format').required('Email is required'),
  password: yup.string().trim().required('Password is required'),
});

const Swirl = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
    <path
      d="M16 16c0-1.5 1.8-2.2 3-1.2 1.6 1.3.9 4-1 4.8-2.6 1.1-5.4-.9-5.6-3.7-.3-3.6 3-6.3 6.4-5.9 4.4.5 7 5 6 9.2-1.2 5-6.7 7.8-11.5 6.4C7.8 24 5 18.5 6.6 13.6 8.3 8.3 14 5.2 19.2 6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Arrow = () => (
  <Icon><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></Icon>
);

export default function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.column}>
          {/* Login card */}
          <section className={`${styles.glass} ${styles.loginCard}`} aria-labelledby="login-title">
            <div className={styles.cardTop}>
              <h1 id="login-title" className={styles.title}>Log in</h1>
              <Link href="/signup" className={styles.signUp}>Sign up</Link>
            </div>

            <div className={styles.brandRow}>
              <span className={styles.swirl}><Swirl /></span>
              <div className={styles.social}>
                <a href="https://facebook.com" aria-label="LÄYRD on Facebook">
                  <Icon><circle cx="12" cy="12" r="9" /><path d="M13.5 8.5h-1a1.5 1.5 0 0 0-1.5 1.5v9M9.5 12.5h4.5" /></Icon>
                </a>
                <a href="https://instagram.com" aria-label="LÄYRD on Instagram">
                  <Icon><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></Icon>
                </a>
              </div>
            </div>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={schema}
              onSubmit={async () => {
                setServerError('');
                try {
                  const response = submitLoginForm();
                  const token = (response as { token?: string } | null)?.token;
                  console.log('Logged in, token:', token); // store the token however your app needs
                  router.push('/');
                } catch (error) {
                  setServerError(error instanceof Error ? error.message : 'Login failed.');
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className={styles.form} noValidate>
                  <div className={styles.field}>
                    <label htmlFor="email" className={styles.srOnly}>Email address</label>
                    <div className={styles.inputPill}>
                      <span className={styles.inputIcon}>
                        <Icon><circle cx="12" cy="12" r="3.5" /><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7" /></Icon>
                      </span>
                      <Field id="email" name="email" type="email" placeholder="E-mail address" autoComplete="email" />
                    </div>
                    <ErrorMessage name="email" component="div" className={styles.error} />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="password" className={styles.srOnly}>Password</label>
                    <div className={styles.inputPill}>
                      <span className={styles.inputIcon}>
                        <Icon><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
                      </span>
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={styles.eye}
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        <Icon>
                          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                          <circle cx="12" cy="12" r="3" />
                          {showPassword && <path d="M4 4l16 16" />}
                        </Icon>
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className={styles.error} />
                  </div>

                  {serverError && <div className={styles.serverError} role="alert">{serverError}</div>}

                  <div className={styles.submitRow}>
                    <div className={styles.tagline}>
                      <p>Freshly layered. Made to order.</p>
                      <small>Cake in a can | Espresso shots</small>
                    </div>
                    <button
                      type="submit"
                      className={styles.goButton}
                      disabled={isSubmitting}
                      aria-label={isSubmitting ? 'Logging in' : 'Log in'}
                    >
                      {isSubmitting ? <span className={styles.spinner} /> : <Arrow />}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </section>

          {/* Wholesale card */}
          <section className={`${styles.glass} ${styles.wholesaleCard}`} aria-labelledby="wholesale-title">
            <h2 id="wholesale-title" className={styles.wholesaleTitle}>Wholesale</h2>
            <p>
              Our wholesale portal is designed for businesses that want premium layered
              desserts, delivered reliably and affordably.
            </p>
            <Link href="/wholesale" className={styles.goldPill}>Apply for Wholesale</Link>
          </section>
        </div>

        {/* Brand card */}
        <section className={`${styles.glass} ${styles.brandCard}`} aria-label="About LÄYRD">
          <div>
            <div className={styles.wordmark}>LÄYRD</div>
            <p className={styles.subtitle}>layered desserts</p>
          </div>

          <div className={styles.brandCopy}>
            <p className={styles.muted}>Made fresh, layered daily.</p>
            <p className={styles.strong}>Espresso shots &amp; event orders.</p>
            <p className={styles.caps}>Cake in a can</p>
          </div>

          <div className={styles.brandBottom}>
            <span className={styles.smallMark}>LÄYRD</span>
            <Link href="/shop" className={`${styles.goldPill} ${styles.shopPill}`}>
              Browse the shop <Arrow />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}