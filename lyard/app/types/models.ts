
enum UserRole {
  Admin  = "ADMIN",
  Editor = "EDITOR",
  Viewer = "Customer",
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
}

export interface Cart {
  cartId: number;
  items: CartItem[];
}

export interface WholeSale extends User{
  WholeSaleId:string;
  address: string;
  PhoneNumber:string;



}



export interface Size { label: string; price: number };

