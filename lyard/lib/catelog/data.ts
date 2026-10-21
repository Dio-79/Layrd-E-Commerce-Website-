import { Product } from "@/app/types/models";
import db from '../server/db';
import { promises } from "dns";




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
        name: "Classic Tiramisu",
        price: 8,
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
        name: "Biscoff Cheesecake",
        price: 8,
        tag: "",
        description: "Creamy cheesecake layered with Biscoff cookie crumb and spread.",
        imageUrl: "/images/Biscoff cheesecake.jpg"
    },
    {
        productID: 11,
        name: "Pumpkin Spice Cheesecake",
        price: 9,
        tag: "LIMITED",
        description: "Limited edition cheesecake with warm pumpkin spice.",
        imageUrl: "/images/Pumpkin spice cheesecake.jpg"
    },
    {
        productID: 12,
        name: "Blue Raspberry Lemonade",
        price: 6,
        tag: "",
        description: "Bright, tangy lemonade with a bold blue raspberry twist.",
        imageUrl: "/images/blue raspberry lemonade.jpg"
    },
    {
        productID: 13,
        name: "Red Raspberry Lemonade",
        price: 6,
        tag: "",
        description: "Classic lemonade sweetened with real red raspberry flavor.",
        imageUrl: "/images/red raspberry lemonade.jpg"
    },
    {
        productID: 14,
        name: "Strawberry Lemonade",
        price: 6,
        tag: "",
        description: "Fresh lemonade blended with sweet strawberry flavor.",
        imageUrl: "/images/strawberry lemonade.jpg"
    },
    {
        productID: 15,
        name: "Mango Lemonade",
        price: 6,
        tag: "",
        description: "Tropical mango meets tart lemonade for a refreshing sip.",
        imageUrl: "/images/mango lemonade.jpg"
    },
    {
        productID: 16,
        name: "Peach Lemonade",
        price: 6,
        tag: "",
        description: "Smooth, juicy peach flavor layered into classic lemonade.",
        imageUrl: "/images/peach lemonade.jpg"
    },
 
    
    


];

export async function getProduct(): Promise<Product[]> {
  return products;
}