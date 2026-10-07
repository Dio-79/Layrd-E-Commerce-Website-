'use client';

import React from 'react';
import { SignupForm as submitSignupForm } from './SignupApi';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import styles from './signup.module.css';

const schema = yup.object({
  username: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SignupForm() {
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
            onSubmit={(values) => {
              console.log('Signup values:', values);
              submitSignupForm();
            }}
          >
            {() => (
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

                {/* Social Login Options */}
                <div className={styles.socialButtons}>
                  <button type="button" className={styles.socialBtn}>
                     Sign up with Apple
                  </button>
                  <button type="button" className={styles.socialBtn}>
                    G Sign up with Google
                  </button>
                </div>

                {/* Main Submit CTA */}
                <button type="submit" className={styles.submitBtn}>
                  Create my account <span>→</span>
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