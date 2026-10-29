"use client";

// Footer newsletter signup: saves the address to Firestore through /api/newsletter.
import { useState, type FormEvent } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("saving");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { already?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't sign you up.");
      setState("done");
      setMessage(data.already ? "You're already on the list. Thanks!" : "Thanks! You're subscribed.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Couldn't sign you up.");
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-black border border-gray-600 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
      />
      <button
        type="submit"
        disabled={state === "saving"}
        className="text-left text-xs font-bold text-gray-400 hover:text-white uppercase disabled:opacity-60"
      >
        {state === "saving" ? "Subscribing…" : "Subscribe"}
      </button>
      {message && (
        <p role={state === "error" ? "alert" : "status"} className={`text-xs ${state === "error" ? "text-red-400" : "text-yellow-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
