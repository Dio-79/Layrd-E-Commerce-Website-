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
}

export interface Customer extends User {
    customerId: number;
    address: string;
    loyaltypoints: number;
}
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
}