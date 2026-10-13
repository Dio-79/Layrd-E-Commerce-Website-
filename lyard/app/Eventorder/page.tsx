// app/Eventorder/page.tsx
import { EventOrderProvider } from "@/app/context/EventOrdercontext";
import Selections from "./formsection";
import { Request } from "./Request";
import Uploadfile from "./uploadimages";
import Calculationpage from "./Calculation";
import SubmitButton from "./SubmitButton";

export default function EventOrderPage() {
  return (
    <EventOrderProvider>
      <main>
        <Selections />
        <Calculationpage />
        <Request />
        <Uploadfile />
        <SubmitButton />
      </main>
    </EventOrderProvider>
  );
}