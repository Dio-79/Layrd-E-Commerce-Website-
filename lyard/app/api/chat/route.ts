// POST /api/chat { message } -> { reply, link? }
// The chat assistant (FR-25). It answers from the FAQ in lib/chat/faq.ts and
// from the live catalog in Firestore (price, description and allergens of a
// product the customer names). Anything it can't answer goes to the contact page.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { readJson, text } from "@/lib/server/forms";
import { matchFaq } from "@/lib/chat/faq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ");

async function productAnswer(message: string) {
  const snap = await adminDb.collection(COLLECTIONS.products).get();
  const q = ` ${norm(message)} `;
  const products = snap.docs.map((d) => d.data()).filter((p) => p.hidden !== true && typeof p.name === "string");
  // Longest name first, so "Oreo Cheesecake" wins over a shorter match.
  const hit = products
    .sort((a, b) => String(b.name).length - String(a.name).length)
    .find((p) => {
      const name = norm(String(p.name)).trim();
      const main = name.split(" ").filter((w) => w.length > 3);
      return q.includes(` ${name} `) || (main.length > 0 && main.every((w) => q.includes(` ${w} `)));
    });
  if (!hit) return null;

  const parts = [`${hit.name} is $${Number(hit.price).toFixed(2)}.`];
  if (hit.description) parts.push(String(hit.description));
  if (Array.isArray(hit.allergens) && hit.allergens.length) parts.push(`Contains: ${hit.allergens.join(", ")}.`);
  if (hit.shelf) parts.push(`${hit.shelf}.`);
  if (typeof hit.stock === "number" && hit.trackStock !== false && hit.stock <= 0) parts.push("It's sold out right now.");
  const page = hit.section === "drinks" ? "/Drinks" : "/products";
  return { reply: parts.join(" "), link: { href: page, label: `See ${hit.name}` } };
}

export async function POST(req: NextRequest) {
  const message = text((await readJson(req))?.message, 500);
  if (!message) return NextResponse.json({ reply: "Ask me anything about LÄYRD: pickup, delivery, allergens, orders or our products." });

  try {
    if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/i.test(message.trim())) {
      return NextResponse.json({ reply: "Hi! I can help with pickup, delivery, order tracking, allergens, event orders and our products. What would you like to know?" });
    }
    const product = await productAnswer(message).catch(() => null);
    const faq = matchFaq(message);
    // A named product beats a general answer, unless the question is about allergens in general.
    if (product && faq?.id !== "refund" && faq?.id !== "track") return NextResponse.json(product);
    if (faq) return NextResponse.json({ reply: faq.answer, link: faq.link });
    return NextResponse.json({
      reply: "I'm not sure about that one. Our team can help. Send us a message and we'll reply by email.",
      link: { href: "/contact", label: "Contact us" },
    });
  } catch (err) {
    console.error("chat failed:", err);
    return NextResponse.json({ reply: "Sorry, I couldn't answer just now. Please try again or contact us.", link: { href: "/contact", label: "Contact us" } });
  }
}
