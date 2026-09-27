import Header  from '@/app/components/Footer';
import Footer from '@/app/components/Header';
import React, { createContext, useContext, useState  } from 'react';

interface AddingItems{
id:number
item: string;

    
}


export default function ProductsPage() {
    


const [Add,setAdd] = useState<string>("")




    return (
        <>
    <Header/>


    <Footer/>
    </>
    
    ) 

}