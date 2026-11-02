import React from 'react';
import { products } from '@/lib/catelog/data';



export default function CatelogPage() {
    return (
        // Catelogue container
        <div>
            {/* shop all */}
            <div>
                {/* filters */}
                <div>
                        {/* Category */}
                    <div>
                        <h1> Category</h1>
                            <ul>
                                <li>All products</li>
                                <li>Bundles</li>
                                <li>Cake in a can</li>
                                <li>Espresso shots</li>
                            </ul>

                    </div>

                    {/* Flavour */}
                    <div>
                        <h1>Flavour</h1>
                            <ul>
                                <li>Fruity</li>
                                <li>Cookie</li>
                                <li>Chocolatey</li>
                                <li>Classic</li>
                                <li>Creamy</li>
                            </ul>

                    </div>
                    {/* Price */}
                    <div>
                        <h1>Price</h1>
                            <ul>
                                <li>Under $5</li>
                                <li>6-15</li>
                                <li>$15</li>
                            </ul>

                    </div>

                </div>

                {/* items */}

                <div>
                    {products.map((product)=>(
                        <div key={product.productID}>
                            <img src={product.imageUrl} alt={product.name} />
                            <h3>{product.description}</h3>
                            <p>{product.description}</p>
                            <p>FROM ${product.price}</p>
                            <button>Custom</button>
                        </div>
                    ))}

                </div>
                
            </div>
            
        </div>
    )
}