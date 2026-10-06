import React from 'react';
import Header  from '@/app/components/Header';
import Footer from '@/app/components/Footer';


export default function Page() {
    return (

        <div className="page-container">
            
            <Header />
            {/* main page */}
            <main>
               <div className="bg-[url(/classic-bundle.jpg)] bg-cover bg-center min-h-[500px]"></div>

                <div className= "font-mono text-[30px]">THIS WEEK'S SPOTLIGHT</div>
            

            </main>
            
            <Footer />
        </div>
    );
};
