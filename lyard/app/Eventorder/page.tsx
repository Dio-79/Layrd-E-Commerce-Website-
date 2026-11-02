import { Montserrat, Cinzel } from "next/font/google";
import { EventOrderProvider } from "@/app/context/EventOrdercontext";
import Calculationpage from "./Calculation";
import { Request } from "./Request";
import Uploadfile from "./uploadimages";
import Selections from "./formsection"; // quantity, date, type, flavors
import SubmitButton from "./SubmitButton";
import styles from "./event.module.css";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { TAX_RATE } from "@/lib/check-out/CheckoutPricing";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export default function EventOrderPage() {
  // Same GST as checkout, so the totals match
  return (
    <EventOrderProvider taxRate={TAX_RATE}>
      <Header />
      <main className={`${styles.page} ${montserrat.variable} ${cinzel.variable}`}>
        <header className={styles.intro}>
          <h1 className={styles.introTitle}>EVENT ORDERING</h1>
          <p className={styles.introText}>
            Planning a wedding, party or office event? Add the drinks and cakes you&apos;d like, choose sizes and
            quantities, tell us the date and type of event, then press Submit to check out. You can upload custom
            labels and ask us anything below.
          </p>
        </header>

        <div className={styles.left}>
          <Calculationpage />
          <Request />
          <Uploadfile />
        </div>

        <aside className={styles.right}>
          <Selections />
          <div className={styles.submitWrap}>
            <SubmitButton />
          </div>
        </aside>
      </main>
      <Footer />
    </EventOrderProvider>
  );
}