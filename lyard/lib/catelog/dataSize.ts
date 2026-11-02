import type { Product, Size } from '@/app/types/models';

const SizeByProduct: Record<number, Size[]> = {
  1: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Large', price: 14 },
  ],
  // Oreo Cheesecake: menu bundles 1 / 4 / 6 cans
  3: [
    { label: '1 can', price: 8 },
    { label: '4 cans', price: 30 },
    { label: '6 cans', price: 44 },
  ],
  4: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Large', price: 14 },
  ],
  5: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 8 },
    { label: 'Large', price: 14 },
  ],
  6: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Large', price: 14 },
  ],
  // Classic Tiramisu: menu bundles 1 / 4 / 6 cans
  7: [
    { label: '1 can', price: 8 },
    { label: '4 cans', price: 30 },
    { label: '6 cans', price: 44 },
  ],
  9: [
    { label: 'small', price: 4.50 },
    { label: 'Medium', price: 9 },
    { label: 'Large', price: 14 },
  ],
  // Biscoff Cheesecake: menu bundles 1 / 4 / 6 cans
  10: [
    { label: '1 can', price: 8 },
    { label: '4 cans', price: 30 },
    { label: '6 cans', price: 44 },
  ],
  // Pumpkin Spice Cheesecake (limited edition, +$1): menu bundles 1 / 4 / 6 cans
  11: [
    { label: '1 can', price: 9 },
    { label: '4 cans', price: 31 },
    { label: '6 cans', price: 45 },
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