import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../components/content.module.css";
import { ROUTES } from "@/lib/Routes/Routes";
import { PICKUP_LOCATION } from "@/lib/Intergration/doordashapi";
import { ALLERGY_DISCLAIMER } from "@/lib/catelog/dataAllergens";

// /info: the footer's Shipping, FAQ, About, Privacy, Terms and Community links.
// Edit the wording here; each section has an id the links jump to (/info#faq, ...).
export const metadata = { title: "LÄYRD · Info & policies" };

const SECTIONS = [
  ["shipping", "Shipping & pickup"],
  ["faq", "FAQ"],
  ["about", "About LÄYRD"],
  ["privacy", "Privacy policy"],
  ["terms", "Terms of service"],
  ["community", "Community"],
] as const;

export default function InfoPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <h1 className={styles.title}>INFO &amp; POLICIES</h1>
        <ul className={styles.toc} aria-label="On this page">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className={styles.link}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        <section id="shipping" className={styles.section}>
          <h2>SHIPPING &amp; PICKUP</h2>
          <p>
            <strong>Pickup:</strong> free, at {PICKUP_LOCATION.address}. Choose &quot;Pickup&quot; at checkout and
            bring your order number.
          </p>
          <p>
            <strong>Delivery:</strong> in Calgary through DoorDash. The delivery fee is shown at checkout once you
            enter your address, and you can follow the courier from your confirmation page.
          </p>
          <p>Prices are in Canadian dollars; 5% GST is added at checkout.</p>
        </section>

        <section id="faq" className={styles.section}>
          <h2>FAQ</h2>
          <p>
            <strong>How long do cakes keep?</strong> Our cakes-in-a-can are made fresh; keep them refrigerated and
            enjoy within a few days.
          </p>
          <p>
            <strong>Do you have allergen information?</strong> Every product page lists its allergens.{" "}
            {ALLERGY_DISCLAIMER}
          </p>
          <p>
            <strong>Can I order for an event?</strong> Yes. Use{" "}
            <Link href={ROUTES.eventOrder} className={styles.link}>
              Event Ordering
            </Link>{" "}
            for larger orders, custom labels and a pickup date.
          </p>
          <p>
            <strong>How do refunds work?</strong> Within 14 days of your order,{" "}
            <Link href={ROUTES.refund} className={styles.link}>
              request a refund
            </Link>{" "}
            and we&apos;ll review it and email you.
          </p>
          <p>
            <strong>Do I need an account?</strong> You can browse as a guest. To place an order, create a free
            account so we can send you updates.
          </p>
        </section>

        <section id="about" className={styles.section}>
          <h2>ABOUT LÄYRD</h2>
          <p>
            LÄYRD makes cake-in-a-can desserts and drinks, layered fresh by hand from simple ingredients and packed
            in our signature cans and jars. We sell online for pickup and delivery in Calgary, and to businesses
            through our wholesale program.
          </p>
        </section>

        <section id="privacy" className={styles.section}>
          <h2>PRIVACY POLICY</h2>
          <p>
            We collect what we need to run your orders: your name, email, phone number and, for delivery, your
            address. Card details go straight to our payment provider (Square or PayPal) and are never stored by us.
            We use your email for order updates, and for our newsletter only if you sign up. We don&apos;t sell your
            information. To see or delete what we hold about you,{" "}
            <Link href={ROUTES.contact} className={styles.link}>
              contact us
            </Link>
            .
          </p>
        </section>

        <section id="terms" className={styles.section}>
          <h2>TERMS OF SERVICE</h2>
          <p>
            Prices and availability can change; the total shown at checkout is the one you pay. Orders are confirmed
            once payment is received (or, for pay-at-pickup and e-Transfer, when we receive your payment). Refunds
            are available within 14 days as described above. Limited-edition flavours are available while supplies
            last.
          </p>
        </section>

        <section id="community" className={styles.section}>
          <h2>COMMUNITY</h2>
          <p>
            Share your LÄYRD moments and tag us{" "}
            <a href="https://instagram.com/l.a.y.r.d" className={styles.link} target="_blank" rel="noreferrer">
              @l.a.y.r.d
            </a>{" "}
            on Instagram. Join the newsletter at the bottom of this page for new flavours and offers.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
