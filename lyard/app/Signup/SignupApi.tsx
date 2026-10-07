'use client';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function Signup(email: string,Name:string, password: string) {
  await wait(150);
  return { token: 'abc123' };
}

export function SignupForm() {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get('email') ?? '');
        const Name = String(formData.get('name') ?? '');
        const password = String(formData.get('password') ?? '');
        await Signup(email, Name, password);
      }}
    >
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">SignupForm</button>
    </form>
  );
}