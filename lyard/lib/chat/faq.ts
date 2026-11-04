// What the LÄYRD chat assistant knows (FR-25). Each entry has the words that
// point to it and the answer. Keep the answers in line with app/info/page.tsx.
export interface FaqEntry {
  id: string;
  keywords: string[];
  answer: string;
  link?: { href: string; label: string };
}

export const FAQ: FaqEntry[] = [
  {
    id: "hours-pickup",
    keywords: ["pickup", "pick up", "collect", "where", "location", "address", "store", "hours", "open"],
    answer: "Pickup is free. Choose Pickup at checkout and bring your order number. You'll see the pickup address on the checkout page.",
    link: { href: "/info#shipping", label: "Shipping & pickup" },
  },
  {
    id: "delivery",
    keywords: ["deliver", "delivery", "doordash", "ship", "shipping", "courier", "calgary"],
    answer: "We deliver in Calgary through DoorDash. The delivery fee appears at checkout once you enter your address.",
    link: { href: "/info#shipping", label: "Shipping & pickup" },
  },
  {
    id: "track",
    keywords: ["track", "tracking", "status", "where is my order", "my order", "order status", "when will"],
    answer: "You can follow every order live on Track My Orders. It updates as soon as we move your order along.",
    link: { href: "/orders", label: "Track My Orders" },
  },
  {
    id: "shelf",
    keywords: ["keep", "fridge", "refrigerate", "shelf", "expire", "how long", "last", "fresh", "storage", "store it"],
    answer: "Our cakes-in-a-can are made fresh. Keep them refrigerated and enjoy within a few days.",
  },
  {
    id: "allergens",
    keywords: ["allergen", "allergy", "allergic", "nut", "nuts", "gluten", "dairy", "milk", "egg", "vegan", "lactose"],
    answer: "Every product page lists its allergens. Our kitchen handles nuts, dairy, eggs and wheat, so we can't guarantee anything is completely free of them.",
    link: { href: "/products", label: "Browse products" },
  },
  {
    id: "event",
    keywords: ["event", "party", "wedding", "birthday", "catering", "label", "custom", "corporate", "large order"],
    answer: "Yes, we do event orders with custom labels and a pickup date. Bigger orders need a few more days' notice.",
    link: { href: "/Eventorder", label: "Event ordering" },
  },
  {
    id: "bundle",
    keywords: ["bundle", "mix", "match", "pack", "gift", "box", "6 pack", "4 pack"],
    answer: "Build your own bundle and pick a flavour for each can on the Mix & Match page.",
    link: { href: "/Bundle", label: "Mix & match bundles" },
  },
  {
    id: "refund",
    keywords: ["refund", "return", "money back", "wrong", "damaged", "broken", "complaint"],
    answer: "Within 14 days of your order you can request a refund. We'll review it and email you.",
    link: { href: "/refund", label: "Request a refund" },
  },
  {
    id: "account",
    keywords: ["account", "sign up", "signup", "register", "login", "log in", "password", "guest"],
    answer: "You can browse as a guest. To order, create a free account so we can send you updates. Forgot your password? Use 'Forgot password' on the login page.",
    link: { href: "/Signup", label: "Create an account" },
  },
  {
    id: "payment",
    keywords: ["pay", "payment", "card", "credit", "visa", "paypal", "apple pay", "google pay", "e-transfer", "etransfer", "cash"],
    answer: "Prices are in Canadian dollars with 5% GST added at checkout. You can pay at pickup, by Interac e-Transfer, or online with a card or PayPal where it's available.",
  },
  {
    id: "promo",
    keywords: ["promo", "coupon", "discount", "code", "sale", "deal", "offer"],
    answer: "Enter a promo code in your cart or at checkout. Current offers, when there are any, show in the banner on the home page.",
    link: { href: "/Cart", label: "Your bag" },
  },
  {
    id: "wholesale",
    keywords: ["wholesale", "bulk", "business", "cafe", "café", "restaurant", "resell", "partner"],
    answer: "Businesses get tiered pricing: 5% off from 50 cans, 12% from 150 and 18% from 300, plus recurring orders. Apply for a wholesale account and we'll set it up.",
    link: { href: "/apply-wholesale", label: "Apply for wholesale" },
  },
  {
    id: "about",
    keywords: ["who", "about", "story", "made", "ingredients", "handmade", "layrd"],
    answer: "LÄYRD makes cake-in-a-can desserts and drinks, layered fresh by hand from simple ingredients, for pickup and delivery in Calgary.",
    link: { href: "/info#about", label: "About LÄYRD" },
  },
  {
    id: "contact",
    keywords: ["contact", "email", "phone", "call", "human", "person", "talk", "speak", "help"],
    answer: "Send us a message and the team will get back to you by email.",
    link: { href: "/contact", label: "Contact us" },
  },
];

export const QUICK_QUESTIONS = ["Where do I pick up?", "Do you deliver?", "Track my order", "Allergens", "Event orders"];

const words = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** The best FAQ entry for a question, or null if nothing matches well. */
export function matchFaq(question: string): FaqEntry | null {
  const q = ` ${words(question).replace(/[^a-z0-9 -]/g, " ")} `;
  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    let score = 0;
    for (const k of entry.keywords) {
      const key = words(k);
      if (q.includes(` ${key} `)) score += key.includes(" ") ? 3 : 2;
      else if (key.length > 4 && q.includes(key)) score += 1;
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}
