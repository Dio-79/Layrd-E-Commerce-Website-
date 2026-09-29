"use client"

import React, { useState } from 'react';

interface Product {
  id: number;
}

interface AddingItems {
  id: string;
  productId: number;
}


    

export default function Button() {
 const [items, setItems] = useState<AddingItems[]>([]);

 function handleAddMore(product: Product) {
   
  const newItem = {  id: crypto.randomUUID(), productId: product.id };
  setItems((items) => [...items, newItem]);
 }

 function handleCancel() {
  setItems([]);
 }

 return(
 <div>
 
 <button type='button' onClick={() => handleAddMore({ id: 0 })}> AddMore </button>
 <ul>
    {items.map((item) => (
      <li key={item.id}>AddMore {item.productId}</li>
    ))}
   </ul>
 <button type='button' onClick={handleCancel}>Cancel</button>

 </div>
 )}