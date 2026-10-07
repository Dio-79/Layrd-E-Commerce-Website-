import React from 'react';
import Header  from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function Page() {
    return(
        <div className ="product container">
            <Header/>

            <main>
                
                <div>
                   
                   {/* Our collection */}
                   <div>
                    
                        <div>
                            <h1>OUR COLLECTION</h1>
                            <p> showing 11 items</p>
                            <p>sort BY: Newest</p>

                        {/* </div> will put in the rest later */}
                            <p>Strawberry matcha</p>
                            <p>single expresso</p>
                        </div>
                    

                   </div>
                   
                   
                    {/* Categories goes here */}
                    <div>
                        
                        <div >
                            <h1>Categories</h1>
                            <p>Cakes</p>
                            <p>Coffee</p>
                            <p>Bundles</p>
                            <p>Limited</p>
                        </div>
                        
                        <div>
                            <h1>Price</h1>
                            <p>Under $5</p>
                            <p>$6-15</p>
                            <p>$15+</p>
                        </div>
                        
                        <div>
                            <h1>Size</h1>
                            <p>150ml</p>
                            <p>100ml</p>
                            <p>50ml</p>
                            <p>4-Pack</p>
                            <p>6+Pack</p>
                        </div>

                        <div>
                            <h1>Flavor Profile</h1>
                            <p>Fruity</p>
                            <p>Cookie</p>
                            <p>Chocolatey</p>
                            <p>Classic</p>
                            <p>Creamy</p>
                        </div>

                    </div>

                </div>
            
            </main>

            <Footer/>




        </div>
        
    )
};