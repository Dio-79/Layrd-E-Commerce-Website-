// lib/Auth/userStore.ts
// Placeholder "database" for registered users. It lives in the browser's localStorage so the
// signup -> login -> role flow works end to end today. Replace the bodies of these functions
// with real fetch() calls to your backend later; the rest of the app will not need to change.

export type Role = 'guest' | 'user' | 'customer' | 'wholesale' | 'admin';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface Session {
  token: string;
  email: string;
  name: string;
  role: Role;
}

const USERS_KEY = 'layrd_users';
const SESSION_KEY = 'layrd_session';

// Where each role lands after signing in (matches `home` in each RoleDefinition).
const ROLE_HOME: Record<Role, string> = {
  guest: '/',
  user: '/account',
  customer: '/',
  wholesale: '/wholesale',
  admin: '/admin',
};

export const homeForRole = (role: Role): string => ROLE_HOME[role] ?? '/';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const target = normalizeEmail(email);
  return readUsers().find((u) => u.email === target);
}

/** Registers a new account. Every new sign-up becomes a "customer". */
export async function createUser(email: string, name: string, password: string): Promise<StoredUser> {
  if (findUserByEmail(email)) {
    throw new Error('An account with this email already exists.');
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizeEmail(email),
    name: name.trim(),
    passwordHash: await hashPassword(password),
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  writeUsers([...readUsers(), user]);
  return user;
}

/** Returns the user if the email and password match, otherwise null. */
export async function verifyCredentials(email: string, password: string): Promise<StoredUser | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  return user.passwordHash === (await hashPassword(password)) ? user : null;
}

export function toSession(user: StoredUser): Session {
  return { token: `session-${user.id}`, email: user.email, name: user.name, role: user.role };
}

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}