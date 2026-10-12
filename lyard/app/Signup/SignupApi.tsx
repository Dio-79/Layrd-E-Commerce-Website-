const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type SignupResult = {
  token: string;
  email: string;
  name: string;
};

export async function signup(
  email: string,
  name: string,
  password: string
): Promise<SignupResult> {
  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required.');
  }

  await wait(150);
  return { token: 'abc123', email, name };
}