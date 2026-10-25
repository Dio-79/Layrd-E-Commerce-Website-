// loginapi.ts
import { verifyCredentials, toSession, type Role } from '@/lib/Auth/store';

export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  email: string;
  name: string;
  role: Role;
}

// Checks the credentials against the user store. The page then passes the result to signIn()
// from useAuth() so the whole app learns who is signed in.
export async function LoginForms(values: LoginValues): Promise<LoginResult> {
  if (!values.email || !values.password) {
    throw new Error('Email and password are required');
  }

  const user = await verifyCredentials(values.email, values.password);
  if (!user) {
    throw new Error('Incorrect email or password.');
  }

  return toSession(user);
}