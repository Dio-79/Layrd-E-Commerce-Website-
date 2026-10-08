'use client';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function Signup(email: string, name: string, password: string) {
  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required.');
  }

  await wait(150);
  return { token: 'abc123', email, name };
}

export function SignupForm() {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get('email') ?? '');
        const name = String(formData.get('name') ?? '');
        const password = String(formData.get('password') ?? '');

        await Signup(email, name, password);
      }}
    >
      <input name="email" type="email" placeholder="Email" />
      <input name="name" type="text" placeholder="Name" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Signup</button>
    </form>
  );
}