"use client";

import { useState } from "react";
import Button from "@/app/components/Button";
import QuantityStepper from "@/app/components/QuantityStepper";
import SizeSelector from "@/app/components/SizeSelector";

type PurchaseOptionsProps = {
  productName: string;
  sizes: string[];
  className?: string;
};

export default function PurchaseOptions({ productName, sizes, className = "" }: PurchaseOptionsProps) {
  const [size, setSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  function addToBag() {
    // TODO: connect to the cart (context, server action or API route).
    setMessage(`Added ${quantity} × ${productName} (${size}) to your bag.`);
  }

  return (
    <div className={className}>
      <SizeSelector options={sizes} value={size} onChange={setSize} />
      <div className="mt-6 flex items-end gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button variant="primary" arrow onClick={addToBag} className="min-w-0 flex-1 max-md:px-4 max-md:text-base max-md:tracking-[0.1em]">
          Add to bag
        </Button>
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  );
}
