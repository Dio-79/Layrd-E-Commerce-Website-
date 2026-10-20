import type { Product, Size } from '@/app/types/models';

const SizeByProduct: Record<number, Size[]> = {
  1: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Medium', price: 14 },

  ],

    2: [
    { label: 'small', price: 1.50 },
    { label: 'Medium', price: 4 },
    { label: 'Medium', price: 10 },

  ],  3: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 8 },
    { label: 'Medium', price: 14 },

  ],  4: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Medium', price: 14 },

  ],  5: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 8 },
    { label: 'Medium', price: 14 },

  ],
    6: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Medium', price: 14 },

  ],
    7: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 4 },
    { label: 'Medium', price: 14 },

  ],  8: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 30},
    { label: 'Medium', price: 14 },

  ],  9: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Medium', price: 14 },

  ],  10: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 6 },
    { label: 'Medium', price: 14 },

  ],
    11: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 14 },
    { label: 'Medium', price: 14 },

  ],
};

export function getSizes(productID: number): Size[] | undefined {
  return SizeByProduct[productID];
}

export function getPrice(product: Product, sizeLabel?: string): number {
  const size = getSizes(product.productID)?.find((s) => s.label === sizeLabel);
  return size ? size.price : product.price;
}

export default SizeByProduct;

