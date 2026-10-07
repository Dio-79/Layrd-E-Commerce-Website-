import React from 'react';
import Header  from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import ProductGrid from './mainpage';
import Sidebar from './sidebar';
import CatalogHeader from './sorting';

export default function Page() {
    return(
        <div className ="product container">
            <Header/>

            <ProductGrid/>
            <Sidebar/>
            <CatalogHeader/>

            <Footer/>




        </div>
        
    )
};