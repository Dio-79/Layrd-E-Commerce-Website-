"use client";

// The LÄYRD chat assistant (FR-25): a button in the corner of every customer
// page that opens a small chat. Answers come from /api/chat. Hidden on the
// admin and wholesale portals.
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QUICK_QUESTIONS } from "@/lib/chat/faq";

type Message = { from: "bot" | "you"; text: string; link?: { href: string; label: string } };

const GOLD = "#c9a227";
const HELLO: Message = { from: "bot", text: "Hi! I'm the LÄYRD assistant. Ask about pickup, delivery, your order, allergens or any product." };

export default function ChatBot() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([HELLO]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/wholesale") || pathname.startsWith("/live")) return null;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { from: "you", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) });
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: String(data.reply ?? "Sorry, something went wrong."), link: data.link }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "I couldn't reach the server. Please try again.", link: { href: "/contact", label: "Contact us" } }]);
    } finally {
      setBusy(false);
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60, fontFamily: "var(--font-montserrat), Montserrat, system-ui, sans-serif" }}>
      {open && (
        <section
          role="dialog"
          aria-label="LÄYRD chat"
          style={{
            width: "min(360px, calc(100vw - 32px))",
            height: "min(480px, calc(100vh - 110px))",
            marginBottom: 12,
            background: "#fff",
            color: "#18181b",
            border: `1px solid ${GOLD}`,
            borderRadius: 14,
            boxShadow: "0 12px 32px rgba(0,0,0,.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <header style={{ background: "#111", color: GOLD, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ letterSpacing: ".15em" }}>LÄYRD</strong>
            <span style={{ color: "#ddd", fontSize: 12 }}>Assistant</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: "none", border: 0, color: "#fff", fontSize: 20, cursor: "pointer" }}>
              ×
            </button>
          </header>

          <div ref={listRef} aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#faf8f4" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.from === "you" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.from === "you" ? "#111" : "#fff",
                  color: m.from === "you" ? "#fff" : "#18181b",
                  border: m.from === "you" ? "none" : "1px solid #e7e1d4",
                  borderRadius: 12,
                  padding: "8px 12px",
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {m.text}
                {m.link && (
                  <div style={{ marginTop: 6 }}>
                    <Link href={m.link.href} onClick={() => setOpen(false)} style={{ color: "#8b651e", fontWeight: 600, textDecoration: "underline" }}>
                      {m.link.label} →
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {busy && <div style={{ alignSelf: "flex-start", fontSize: 13, color: "#71717a" }}>Typing…</div>}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)}
                    style={{ border: `1px solid ${GOLD}`, background: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #e7e1d4" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message"
              aria-label="Your message"
              maxLength={500}
              style={{ flex: 1, border: "1px solid #d4cfc2", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
              style={{ background: GOLD, color: "#111", border: 0, borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer", opacity: busy || !input.trim() ? 0.5 : 1 }}>
              Send
            </button>
          </form>
        </section>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close chat" : "Chat with us"}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "#111", color: GOLD, border: `2px solid ${GOLD}`, fontSize: 24, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,.25)" }}
        >
          {open ? "×" : "💬"}
        </button>
      </div>
    </div>
  );
}
