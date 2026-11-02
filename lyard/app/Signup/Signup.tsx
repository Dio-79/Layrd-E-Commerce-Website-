'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { setPendingVerification, signUpWithEmail } from '@/lib/Auth/firebaseAuth';
import { ROUTES } from '@/lib/Routes/Routes';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import styles from './Signup.module.css';
import GoogleButton from '@/app/components/GoogleButton';

const schema = yup.object({
  username: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SignupForm() {
  const router = useRouter();
  const [googleError, setGoogleError] = useState('');
  const { user, loading, home } = useAuth();

  // Already logged in: no need to sign up.
  useEffect(() => {
    if (!loading && user) router.replace(home);
  }, [loading, user, home, router]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.cardGrid}>
        {/* Left Form Card */}
        <div className={`${styles.glassCard} ${styles.formCard}`}>
          <div className={styles.cardHeader}>
            <span className={styles.logoText}>LÄYRD</span>
            <a href="/login" className={styles.loginLink}>
              Log in
            </a>
          </div>

          <h2 className={styles.title}>Create account</h2>

          <Formik
            initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              setStatus(undefined);
              try {
                // Creates the Firebase account and emails the verification link. The site
                // makes them a "customer" when they're signed in after verifying.
                const email = values.email.trim();
                const name = values.username.trim();
                const result = await signUpWithEmail(email, values.password, name);
                setPendingVerification({ idToken: result.idToken, refreshToken: result.refreshToken, email, name });
                router.push(ROUTES.verify);
              } catch (err) {
                setStatus(err instanceof Error ? err.message : 'Something went wrong.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status }) => (
              <Form>
                <div className={styles.inputGroup}>
                  {/* Name */}
                  <div>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputIcon}>N:</span>
                      <Field
                        name="username"
                        type="text"
                        placeholder="Full name"
                        className={styles.glassInput}
                      />
                    </div>
                    <ErrorMessage name="username" component="div" className={styles.errorText} />
                  </div>

                  {/* Email */}
                  <div>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputIcon}>@</span>
                      <Field
                        name="email"
                        type="email"
                        placeholder="E-mail address"
                        className={styles.glassInput}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className={styles.errorText} />
                  </div>

                  {/* Password */}
                  <div>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputIcon}>🔑</span>
                      <Field
                        name="password"
                        type="password"
                        placeholder="Password"
                        className={styles.glassInput}
                      />
                    </div>
                    <ErrorMessage name="password" component="div" className={styles.errorText} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputIcon}>🔑</span>
                      <Field
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        className={styles.glassInput}
                      />
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className={styles.errorText}
                    />
                  </div>
                </div>

                {/* Submit error from the API */}
                {status && <div className={styles.errorText}>{status}</div>}

                {/* Social Login Options */}
                <div className={styles.socialButtons}>
                  <GoogleButton className={styles.socialBtn} label="Sign up with Google" onError={setGoogleError} />
                  {googleError && (
                    <div className={styles.errorText} role="alert">
                      {googleError}
                    </div>
                  )}
                </div>

                {/* Main Submit CTA */}
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account…' : 'Create my account'} <span>→</span>
                </button>

                {/* Footer Notice */}
                <p className={styles.wholesaleText}>
                  Ordering for a business?{' '}
                  <a href="/wholesale" className={styles.wholesaleLink}>
                    Wholesale sign up
                  </a>
                </p>
              </Form>
            )}
          </Formik>
        </div>

        {/* Right Brand Card */}
        <div className={`${styles.glassCard} ${styles.brandCard}`}>
          <h1 className={styles.largeBrandLogo}>LÄYRD</h1>
          <p className={styles.taglineText}>Made for you</p>
        </div>
      </div>
    </div>
  );
}