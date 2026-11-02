

// 1. Database / API role identifiers (ALL_CAPS)
export type UserRole = "ADMIN" | "EDITOR" | "GUEST" | "CUSTOMER";

// 2. Human-readable UI display labels
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  EDITOR: 'Editor',
  GUEST: 'Guest User',
  CUSTOMER: 'Customer',
};
export interface FilterState {
  categories: string[];
  priceRanges: string[];
  minPrice: string;
  maxPrice: string;
  sizes: string[];
  flavorProfiles: string[];
}

export interface Product {
    productID: number;
    name: string;
    price: number;
    tag: string;
    description: string;
    imageUrl: string;
}

export interface User{
    userID: number;
    name: string;
    email: string;
    passwords: string;
    phone: string;
    role: UserRole
}

export interface Customer extends User {
    customerId: number;
    address: string;
    loyaltypoints: number;
    UserRole:Customer;
}
export interface CartItem {
  product: Product;
  quantity: number;
  /** Chosen size label (e.g. "Large", "4 cans"); product.price is that size's price */
  size?: string;
  flavor?: string;
  /** Lines added together, e.g. one custom bundle */
  group?: { id: string; name: string };
}

/** One cart line per product + size + flavor + group. */
export const cartKey = (item: Pick<CartItem, "product" | "size" | "flavor" | "group">) =>
  [item.product.productID, item.size ?? "", item.flavor ?? "", item.group?.id ?? ""].join("|");

export interface Cart {
  cartId: number;
  items: CartItem[];
}

export interface WholeSale extends User{
  WholeSaleId:string;
  address: string;
  PhoneNumber:string;



}
export interface ProductItem {
  id: string;
  name: string;
  tag?: "LIMITED" | "CLASSIC" | "POPULAR";
  description: string;
  price: number;
  category: "Cakes" | "Coffee" | "Bundles";
  imageUrl: string;
  bgGradient: string;
  accentColor: string;
}



export interface Size { label: string; price: number };

