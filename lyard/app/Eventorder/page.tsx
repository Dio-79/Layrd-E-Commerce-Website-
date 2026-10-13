import Header  from '@/app/components/Footer';
import Footer from '@/app/components/Header';
import { Request } from './commentsection';
import Selections from './formsection';
import SubmitButton from './SubmitButton';
import Uploadfile from './uploadimages';
import Calculationpage from './Calculation';



  export default function EventOrderPage() {
  return (
    <EventOrderProvider>
      <main className={styles.page}>
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