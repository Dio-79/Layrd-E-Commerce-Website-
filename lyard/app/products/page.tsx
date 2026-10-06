import React from 'react';
import Header  from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function Page() {
    return(
        <div className ="product container">
            <Header/>

            <main>
                <div className= "product and cetgories">
                    <div className ="our collection">
                        <p> list of items goes here</p>
                    </div>
                    
                    <div className ="categories">
                        <p> categories goes here</p>
                    </div>

                </div>
            
            </main>

            <Footer/>




        </div>
        
    )
}