import { Product, Customer } from "@/app/types/models";
import db from '../lib/db';


export const products: Product[] = [
    {
        productID: 1,
        name: "Strawberry Matcha",
        price: 9,
        tag: "LIMITED",
        description: "Vibrant, creamy fusion of earthy matcha and sweet strawberry.",
        imageUrl: "/images/Strawberry matcha.jpg"
    },
    {
        productID: 2,
        name: "Single espresso",
        price: 4,
        tag: "CLASSIC",
        description: "Compact shot of rich, bold coffee sealed for freshness and ready to enjoy anywhere.",
        imageUrl: "/images/Single expresso.jpg"  
    },
    {
        productID: 3,
        name: "Oreo Cheesecake",
        price: 8,
        tag: "POPULAR",
        description: "Creamy desert that blends cheesecake with crushed Oreos.",
        imageUrl: "/images/Oreo cheesecake.jpg"
    },
    {
        productID: 4,
        name: "fruit salad",
        price: 9,
        tag: "",
        description: "Bright, creamy cheesecake layered with mixed fresh fruits for a refreshing bite.",
        imageUrl: "/images/fruit salad.jpg"  
    },
    {
        productID: 5,
        name: "Lotus Cheesecake",
        price: 8,
        tag: "",
        description: "Lotus-infused cheesecake for a sweet, deeply comforting flavor.",
        imageUrl: "/images/Lotus cheesecake.jpg"  
    },
    {
        productID: 6,
        name: "Kinder Bueno",
        price: 9,
        tag: "",
        description: "Hazelnut-cream cheesecake blended with chocolate wafers for Kinder Bueno lovers.",
        imageUrl: "/images/Kinder Bueno.jpg"  
    },
    {
        productID: 7,
        name: "Tiramisu",
        price: 9,
        tag: "",
        description: "Infused with espresso and cocoa, capturing the rich indulgence of classic tiramisu.",
        imageUrl: "/images/tiramisu.jpg"  
    },
    {
        productID: 8,
        name: "Double Espresso",
        price: 4,
        tag: "",
        description: "Bold, concentrated burst of rich coffee, with the grab-and-go convenience.",
        imageUrl: "/images/double expresso.jpg"  
    },
    {
        productID: 9,
        name: "Classic Bundle",
        price: 30,
        tag: "",
        description: "Curated 4-pack including Tiramisu, Lotus, Oreo, and Fruit Salad cheesecakes.",
        imageUrl: "/images/classic bundle.jpg"  
    },
    {
        productID: 10,
        name: "Espresso Duo",
        price: 6,
        tag: "",
        description: "Single and double duo offers a balanced caffeine pairing.",
        imageUrl: "/images/expresso duo.jpg"  
    },
    {
        productID: 11,
        name: "Espresso bundle",
        price: 14,
        tag: "",
        description: "Mixed espresso bundle for four. Or four for yourself.",
        imageUrl: "/images/classic bundle.jpg"  
    }
     

    


];


export async function login(email: string, password: string) {
  const response = await fetch('/api/login', {
    method: 'POST', //fetch the results of the post request from 
    body: JSON.stringify({
      email,
      password,
    }),
  });
  const data = await response.json();

  return data.user ?? null;
}