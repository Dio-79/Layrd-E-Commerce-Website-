import Header  from '@/app/components/Footer';
import Footer from '@/app/components/Header';
import React, {  useState  } from 'react';
interface Product {
  id: number;
}

interface AddingItems {
  id: number;
  productId: number;
}


export default function ProductsPage() {
    


const [items,setItems] = useState<AddingItems[]>([])
  const [loading, setLoading] = useState<boolean>(true);

function handleAddMore(product: Product) {
  const newItem = { id: Date.now(), productId: product.id };
  setItems([...items, newItem]);
}


    return (
        <>
    <Header/>
 <div>
 
 <button type='button'></button>


 </div>

    <Footer/>
    </>
    
    ) 

}