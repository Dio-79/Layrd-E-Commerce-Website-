import Header  from '@/app/components/Footer';
import Footer from '@/app/components/Header';
import { Request } from './commentsection';
import Selections from './formsection';
import SubmitButton from './SubmitButton';
import Uploadfile from './uploadimages';
import Calculationpage from './Calculation';

export default function ProductsPage() {

    return (
        <>
    <Header/>
 
<Calculationpage/>
<Request/>
<Selections/>
<Uploadfile/>
<SubmitButton/>
    <Footer/>
    </>
    
    ) 

}