import type { ReactNode } from 'react';
import Request from './commentsection';
import Selections from './formsection';
import SubmitButton from './SubmitButton';
import Uploadfile from './uploadimages';
import Calculationpage from './Calculation';

const EventOrderProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
const OrderSummary = () => null;

export default function EventOrderPage() {
  return (
    <EventOrderProvider>
      <main className="page">
        <h1>Event Order</h1>

        <Selections />
        <Calculationpage />
        <Request />
        <Uploadfile />

        <SubmitButton />
        <OrderSummary />
      </main>
    </EventOrderProvider>
  );
}