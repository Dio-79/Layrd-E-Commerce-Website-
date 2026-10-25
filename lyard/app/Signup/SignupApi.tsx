import { createUser, toSession, type Role } from '@/lib/Auth/store';

export type SignupResult = {
  token: string;
  email: string;
  name: string;
  role: Role;
};

// Registers the account in the user store as a "customer". The page then calls signIn()
// from useAuth() with the result.
export async function signup(
  email: string,
  name: string,
  password: string
): Promise<SignupResult> {
  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required.');
  }

  const user = await createUser(email, name, password);
  return toSession(user);
}