import { Montserrat, Cinzel } from "next/font/google";
import { EventOrderProvider } from "@/app/context/EventOrdercontext";
import Calculationpage from "./Calculation";
import { Request } from "./Request";
import Uploadfile from "./uploadimages";
import Selections from "./formsection"; // event details form: quantity, date, type, flavors
import SubmitButton from "./SubmitButton";
import OrderSummary from "./OrderSummary";
import styles from "./event.module.css";
import Footer from "../components/Footer";
import Header from "../components/Header";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export default function EventOrderPage() {
  return (
    <EventOrderProvider taxRate={0.08}>
      <Header/>
      <main className={`${styles.page} ${montserrat.variable} ${cinzel.variable}`}>
        <div className={styles.left}>
          <Calculationpage />
          <Request />
          <Uploadfile />
        </div>

        <aside className={styles.right}>
          <Selections />
          <SubmitButton />
          <OrderSummary />
        </aside>
      </main>
      <Footer/>
    </EventOrderProvider>
  );
}