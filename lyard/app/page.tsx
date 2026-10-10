import React from 'react';
import Header  from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import LoginForm from './login/loginpage';


export default function Page() {
    return (

        <div className="page-container">
            
            <Header />
            {/* main page */}
            <main>
              <LoginForm/>

            </main>
            
            <Footer />
        </div>
    );
};
