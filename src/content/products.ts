const jarRedVelvet = "/images/products/jar-red-velvet.webp";

const jarChocolate1 = "/images/products/jar-red-velvet.webp";
const jarChocolate2 = "/images/products/chocolate-cake-in-jar-600x600.webp";
const jarChocolate3 = "/images/products/choco-chip-jar-cake-set-of-2.webp";
const jarChocolate4 = "/images/products/jar-red-velvet.webp";

const dessert1 = "/images/products/jar-red-velvet.webp";
const dessert2 = "/images/products/jar-red-velvet.webp";
const dessert3 = "/images/products/jar-red-velvet.webp";
const dessert4 = "/images/products/jar-red-velvet.webp";

export type SugarLevel = "Normal" | "Less" | "No sugar*";
export type SizeOption = { id: string; label: string; serves?: string; priceLkr: number };

export type Product = {
  slug: string;
  name: string;
  slogan: string;

  category: "Jar Cakes" | "Desserts";

  shortDesc: string;
  description: string;

  thumbnail?: { src: string; alt: string };
  images: { src: string; alt: string }[];

  nutrition: {
    serving: string;
    calories: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
  };

  inPackage: string[];
  sizes: SizeOption[];
  sugarLevels: SugarLevel[];
  tags?: string[];
};

export const products: Product[] = [
  // ----------------------------
  // JAR CAKES
  // ----------------------------
  {
    slug: "midnight-choco-jar",
    name: "Midnight Chocolate Jar",
    slogan: "Deep cocoa layers. Silky finish. Pure comfort.",
    category: "Jar Cakes",
    shortDesc: "Chocolate cake base with smooth cream and premium toppings.",
    description:
      "A rich chocolate jar cake built with soft cake layers, smooth cream, and a balanced sweetness. Finished with premium toppings for that calm, luxurious bite.",
    thumbnail: { src: jarChocolate1, alt: "Midnight Chocolate Jar Cake" },
    images: [
      { src: jarChocolate1, alt: "Midnight Chocolate Jar Cake - front view" },
      { src: jarChocolate2, alt: "Midnight Chocolate Jar Cake - top view" },
      { src: jarChocolate3, alt: "Midnight Chocolate Jar Cake - close up" },
      { src: jarChocolate4, alt: "Midnight Chocolate Jar Cake - packaging" },
      { src: jarRedVelvet, alt: "Midnight Chocolate Jar Cake - extra angle" },
    ],
    nutrition: { serving: "1 jar", calories: 520, carbsG: 62, proteinG: 7, fatG: 26 },
    inPackage: ["Sealed jar cup", "Spoon (on request)", "Carry bag (on request)"],
    sizes: [
      { id: "mini", label: "Mini Jar", serves: "1", priceLkr: 450 },
      { id: "regular", label: "Regular Jar", serves: "1–2", priceLkr: 650 },
    ],
    sugarLevels: ["Normal", "Less", "No sugar*"],
    tags: ["Best seller", "Rich cocoa"],
  },
  {
    slug: "red-velvet-bliss-jar",
    name: "Red Velvet Bliss Jar",
    slogan: "Velvety crumb. Creamy top. Celebration mood.",
    category: "Jar Cakes",
    shortDesc: "Red velvet base with smooth cream and a premium finish.",
    description:
      "Soft red velvet layers with a smooth, creamy finish. Light, premium, and perfect for gifting or celebrating small moments.",
    thumbnail: { src: jarRedVelvet, alt: "Red Velvet Jar Cake" },
    images: [
      { src: jarRedVelvet, alt: "Red Velvet Jar Cake - front view" },
      { src: jarRedVelvet, alt: "Red Velvet Jar Cake - top view" },
      { src: jarRedVelvet, alt: "Red Velvet Jar Cake - close up" },
      { src: jarRedVelvet, alt: "Red Velvet Jar Cake - packaging" },
      { src: jarRedVelvet, alt: "Red Velvet Jar Cake - extra angle" },
    ],
    nutrition: { serving: "1 jar", calories: 480, carbsG: 58, proteinG: 6, fatG: 22 },
    inPackage: ["Sealed jar cup", "Spoon (on request)", "Carry bag (on request)"],
    sizes: [
      { id: "mini", label: "Mini Jar", serves: "1", priceLkr: 480 },
      { id: "regular", label: "Regular Jar", serves: "1–2", priceLkr: 690 },
    ],
    sugarLevels: ["Normal", "Less"],
    tags: ["Crowd favorite", "Creamy"],
  },

  {
    slug: "ribbon-dream-jar",
    name: "Ribbon Dream Jar",
    slogan: "Soft vanilla layers. Gentle sweetness. Calm luxury.",
    category: "Jar Cakes",
    shortDesc: "Vanilla ribbon layers with light cream and toppings.",
    description:
      "A calm, vanilla-forward jar cake with soft ribbon layers and a light creamy top. Balanced sweetness with a refreshing finish.",
    thumbnail: { src: jarRedVelvet, alt: "Ribbon Jar Cake" },
    images: [
      { src: jarRedVelvet, alt: "Ribbon Jar Cake - front view" },
      { src: jarRedVelvet, alt: "Ribbon Jar Cake - top view" },
      { src: jarRedVelvet, alt: "Ribbon Jar Cake - close up" },
      { src: jarRedVelvet, alt: "Ribbon Jar Cake - packaging" },
      { src: jarRedVelvet, alt: "Ribbon Jar Cake - extra angle" },
    ],
    nutrition: { serving: "1 jar", calories: 460, carbsG: 60, proteinG: 6, fatG: 20 },
    inPackage: ["Sealed jar cup", "Spoon (on request)"],
    sizes: [
      { id: "mini", label: "Mini Jar", serves: "1", priceLkr: 420 },
      { id: "regular", label: "Regular Jar", serves: "1–2", priceLkr: 620 },
    ],
    sugarLevels: ["Normal", "Less"],
    tags: ["Light & smooth"],
  },

  // ----------------------------
  // DESSERTS
  // ----------------------------
  {
    slug: "choco-biscuit-pudding",
    name: "Velvet Choco Biscuit Pudding",
    slogan: "Chilled layers. Chocolate comfort. Smooth finish.",
    category: "Desserts",
    shortDesc: "Classic chocolate biscuit pudding — rich and chilled.",
    description:
      "A nostalgic chocolate biscuit pudding with a premium smooth finish. Served chilled for that calm, refreshing bite.",
    thumbnail: { src: dessert1, alt: "Chocolate biscuit pudding" },
    images: [
      { src: dessert1, alt: "Chocolate biscuit pudding - front view" },
      { src: dessert2, alt: "Chocolate biscuit pudding - top view" },
      { src: dessert3, alt: "Chocolate biscuit pudding - close up" },
      { src: dessert4, alt: "Chocolate biscuit pudding - packaging" },
      { src: jarRedVelvet, alt: "Chocolate biscuit pudding - extra angle" },
    ],
    nutrition: { serving: "1 cup", calories: 430, carbsG: 58, proteinG: 5, fatG: 20 },
    inPackage: ["Sealed cup", "Spoon (on request)"],
    sizes: [
      { id: "cup", label: "Cup", serves: "1", priceLkr: 450 },
      { id: "tub", label: "Family Tub", serves: "3–4", priceLkr: 1250 },
    ],
    sugarLevels: ["Normal", "Less"],
    tags: ["Chilled", "Classic"],
  },
];
