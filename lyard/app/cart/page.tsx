import React from 'react';
import Header  from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Link from 'next/link';


export default function Page() {
    return(

            <div className = "cart container">
                <main>
            <div className ="cart">

                {/* this is where the YOUR CART and description goes */}
                <div>
                    <h1>Your Cart</h1>
                    <p className="small text">Review your selections before completing your order </p>
                    
                    {/* product quantity and total */}
                    <div>
                        <h2> Product</h2>
                        <h2>quantity</h2>
                        <h2>total</h2>


                    </div>
                    {/* the product summary and price */}
                    <div>
                        {/* this is where the back end for the products would go */}
                    </div>

                </div>
                
                <div className ="order summary">

                </div>

                <p>
                    <Link href="/products">Continue shopping</Link>
                </p>
            </div>

        </main>

    </div>
    )
}