// loginapi.ts
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LoginValues {
  email: string;
  password: string;
}

// Mock login. Replace the body with a real fetch() to your backend later.
export async function LoginForms(values: LoginValues): Promise<{ token: string }> {
  await wait(150);

  if (!values.email || !values.password) {
    throw new Error('Email and password are required');
  }

  return { token: 'abc123' };
}