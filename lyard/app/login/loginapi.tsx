'use client';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function Login(email: string, password: string) {
  await wait(150);
  return { token: 'abc123' };
}

export function LoginForms() {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get('email') ?? '');
        const password = String(formData.get('password') ?? '');
        await Login(email, password);
        window.location.href = '/';
      }}
    >
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>

    </form>
  );
}