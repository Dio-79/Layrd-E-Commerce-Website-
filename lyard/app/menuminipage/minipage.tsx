'use client';
import { useState } from 'react';
import { ProductItem } from "@/app/types/models";
import { products } from "@/lib/data";

interface ProductCardProps {
  product: ProductItem;
  onCustomize?: (product: ProductItem) => void;
}

function ProductCard({ product, onCustomize }: ProductCardProps) {
  return (
    <div>
      {/* Brand Tag Badge */}
      {product.tag && (
        <div>
          <span>{product.tag}</span>
        </div>
      )}

      {/* Brand Overlay Header */}
      <div>
        <span>LĀYRD</span>
        <span>{product.category}</span>
      </div>

      {/* Text Content */}
      <div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>

      {/* Pricing & Action */}
      <div>
        <div>
          <span>FROM</span>
          <span>${product.price}</span>
        </div>

        <button
          type="button"
          onClick={() => onCustomize && onCustomize(product)}
        >
          Customize
        </button>
      </div>
    </div>
  );
}

export default function ProductGrid() {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const handleCustomize = (product: ProductItem) => {
    setSelectedProduct(product);
  };

  return (
    <div>
      {/* Header Section */}
      <header>
        <h1>LĀYRD Catalog</h1>
        <p>Showing {products.length} items</p>
      </header>

      {/* Product List */}
      <div>
        {(products as unknown as ProductItem[]).map((product) => (
          <ProductCard
            key={`${product.name}-${product.category}`}
            product={product}
            onCustomize={handleCustomize}
          />
        ))}
      </div>

      {/* Customization Dialog */}
      {selectedProduct && (
        <div>
          <div>
            <h3>Customize {selectedProduct.name}</h3>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>
          </div>
          <p>{selectedProduct.description}</p>
          <div>
            Base Price: <span>${selectedProduct.price}</span>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}