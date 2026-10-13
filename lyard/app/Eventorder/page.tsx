import { Montserrat, Cinzel } from "next/font/google";
import { EventOrderProvider } from "@/app/context/EventOrdercontext";
import Calculationpage from "./Calculation";
import { Request } from "./Request";
import Uploadfile from "./uploadimages";
import Selections from "./commentsection";
import SubmitButton from "./SubmitButton";
import styles from "./event.module.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export default function EventOrderPage() {
  return (
    <EventOrderProvider taxRate={0.08}>
      <main className={`${styles.page} ${montserrat.variable} ${cinzel.variable}`}>
        <div className={styles.left}>
          <Calculationpage />
          <Request />
          <Uploadfile />
        </div>

        <aside className={styles.right}>
          <Selections />
          <SubmitButton />
        </aside>
      </main>
    </EventOrderProvider>
  );
}