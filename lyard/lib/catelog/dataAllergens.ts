import type { Product } from '@/app/types/models';

export interface AllergenInfo {
  containsGluten: boolean;
  allergens: string[];
}

const AllergensByProduct: Record<number, AllergenInfo> = {
  1:  { containsGluten: false, allergens: ["Milk/Dairy"] },               // Strawberry Matcha
  3:  { containsGluten: true,  allergens: ["Milk/Dairy", "Wheat/Gluten", "Soy"] },      // Oreo Cheesecake
  4:  { containsGluten: false, allergens: ["Milk/Dairy"] },               // Fruit Salad
  5:  { containsGluten: true,  allergens: ["Milk/Dairy", "Wheat/Gluten", "Soy"] },      // Lotus Cheesecake
  6:  { containsGluten: true,  allergens: ["Milk/Dairy", "Wheat/Gluten", "Soy", "Tree Nuts (hazelnut)"] }, // Kinder Bueno
  7:  { containsGluten: true,  allergens: ["Milk/Dairy", "Eggs", "Wheat/Gluten"] },     // Classic Tiramisu
  9:  { containsGluten: true,  allergens: ["Milk/Dairy", "Eggs", "Wheat/Gluten", "Soy"] }, // Classic Bundle
  12: { containsGluten: true,  allergens: ["Milk/Dairy", "Wheat/Gluten", "Soy"] },      // Biscoff Cheesecake
  13: { containsGluten: true,  allergens: ["Milk/Dairy", "Wheat/Gluten", "Soy"] },      // Pumpkin Spice Cheesecake
};

const DEFAULT_ALLERGEN_INFO: AllergenInfo = {
  containsGluten: false,
  allergens: [],
};

export function getAllergenInfo(productID: number): AllergenInfo {
  return AllergensByProduct[productID] ?? DEFAULT_ALLERGEN_INFO;
}

export const ALLERGY_DISCLAIMER =
  "Products are prepared in a kitchen that handles milk, eggs, wheat/gluten and soy. Cross-contact with other allergens may occur. None of our products are gluten-free. Please speak with a team member before purchasing if you have food allergies or dietary concerns.";

export default AllergensByProduct;