// lib/auth.ts
// Browser-side helpers that talk to your /api/auth routes.
// No "use client" needed: it has no React code, so client components can import it.

export interface User {
  id: number | string;
  email: string;
  name: string;
}

// Sends JSON to an API route and returns the parsed response.
// Throws an Error with the server's message so pages can show it on screen.
async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

/** Logs in. Returns the user, or throws (for example "Invalid email or password"). */
export async function login(email: string, password: string): Promise<User> {
  const data = await postJSON<{ user: User }>("/api/login", { email, password });
  return data.user;
}