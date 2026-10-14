import hero from "@/assets/hero.jpg";
import wedding from "@/assets/wedding.jpg";
import mala from "@/assets/mala.jpg";
import crochet from "@/assets/crochet.jpg";
import hamper from "@/assets/hamper.jpg";
import diwali from "@/assets/diwali.jpg";
import haldi from "@/assets/haldi.jpg";
import poojakit from "@/assets/poojakit.jpg";
import mehendi from "@/assets/mehendi.jpg";

export const img = { hero, wedding, mala, crochet, hamper, diwali, haldi, poojakit, mehendi };

export const occasions = [
  { name: "Wedding / Vivah", img: wedding },
  { name: "Haldi", img: haldi },
  { name: "Mehendi", img: mehendi },
  { name: "Sangeet", img: crochet },
  { name: "Engagement / Roka", img: mala },
  { name: "Diwali", img: diwali },
  { name: "Hawan", img: poojakit },
  { name: "Griha Pravesh", img: hero },
  { name: "Janam Sanskar", img: poojakit },
  { name: "Navratri", img: diwali },
  { name: "Rakhi", img: hamper },
  { name: "Karwa Chauth", img: wedding },
];

export const categories = [
  { name: "Pooja Kits", img: poojakit },
  { name: "Wedding Essentials", img: wedding },
  { name: "Mala & Chadhava", img: mala },
  { name: "Decorative Plates & Trays", img: wedding },
  { name: "Kalash & Nariyal", img: diwali },
  { name: "Potli & Batua", img: wedding },
  { name: "Handcrafted Crochet", img: crochet },
  { name: "Varmala", img: crochet },
  { name: "Return Gifts", img: hamper },
  { name: "Gift Hampers", img: hamper },
  { name: "Pooja Thali & Aarti Sets", img: hero },
  { name: "Handmade Décor", img: crochet },
];

export type Product = {
  id: string; name: string; price: number; mrp?: number; rating: number; reviews: number;
  badge?: string; img: string; category: string; occasion: string;
  categorySlug?: string; subSlug?: string; description?: string;
};

export const products: Product[] = [
  {
    id: "p1", name: "Premium Wedding Pooja Kit", price: 2499, mrp: 2999, rating: 4.8, reviews: 0,
    badge: "Best Seller", img: poojakit, category: "Pooja Kits", occasion: "Wedding",
    categorySlug: "pooja-rituals", subSlug: "pooja-kits",
    description: "Complete hand-curated kit for all wedding pooja rituals, blessed and thoughtfully packed.",
  },
  {
    id: "p2", name: "Designer Wedding Potli", price: 649, mrp: 799, rating: 4.7, reviews: 0,
    badge: "Handcrafted", img: wedding, category: "Potli & Batua", occasion: "Wedding",
    categorySlug: "wedding-essentials", subSlug: "wedding-potli-batua",
    description: "Handcrafted potli in rich fabric with zari embroidery, perfect for shagun and gifting.",
  },
  {
    id: "p3", name: "Decorative Shagun Thali", price: 1299, rating: 4.6, reviews: 0,
    badge: "New Arrival", img: hero, category: "Decorative Plates & Trays", occasion: "Engagement",
    categorySlug: "wedding-essentials", subSlug: "shagun-envelopes-boxes-thalis",
    description: "Beautifully decorated thali for shagun and engagement ceremonies.",
  },
  {
    id: "p4", name: "Elaichi Mala", price: 449, mrp: 549, rating: 4.9, reviews: 0,
    badge: "Best Seller", img: mala, category: "Mala & Chadhava", occasion: "Wedding",
    categorySlug: "mala-accessories-handmade", subSlug: "elaichi-mala",
    description: "Fresh elaichi mala hand-strung for puja and garland offerings.",
  },
  {
    id: "p5", name: "Handcrafted Varmala", price: 3499, rating: 4.8, reviews: 0,
    badge: "Handcrafted", img: crochet, category: "Varmala", occasion: "Wedding",
    categorySlug: "crochet", subSlug: "varmala",
    description: "Lush crochet varmala handcrafted with vibrant yarn and zari accents for the wedding ceremony.",
  },
  {
    id: "p6", name: "Festive Dry Fruit Gift Box", price: 1899, mrp: 2199, rating: 4.7, reviews: 0,
    img: hamper, category: "Gift Hampers", occasion: "Diwali",
    categorySlug: "wedding-decor-gifting", subSlug: "gift-hampers",
    description: "Premium assorted dry fruit gift box, ideal for festive and wedding gifting.",
  },
  {
    id: "p7", name: "Decorative Kalash Set", price: 1599, rating: 4.6, reviews: 0,
    badge: "New Arrival", img: diwali, category: "Kalash & Nariyal", occasion: "Griha Pravesh",
    categorySlug: "wedding-decor-gifting", subSlug: "decorative-kalash",
    description: "Ornate kalash set with intricate design for auspicious occasions and décor.",
  },
  {
    id: "p8", name: "Customized Return Gift Hamper", price: 899, rating: 4.8, reviews: 0,
    badge: "Customizable", img: hamper, category: "Return Gifts", occasion: "Wedding",
    categorySlug: "wedding-decor-gifting", subSlug: "return-gifts",
    description: "Customisable return gift hamper with your branding and choice of items.",
  },
  {
    id: "p9", name: "Haldi Ceremony Tray Set", price: 1149, rating: 4.5, reviews: 0,
    img: haldi, category: "Decorative Plates & Trays", occasion: "Haldi",
    categorySlug: "wedding-decor-gifting", subSlug: "decorative-plates-trays",
    description: "Vibrant haldi tray set with coordinated accessories for the haldi ceremony.",
  },
  {
    id: "p10", name: "Crochet Keychain Set", price: 299, rating: 4.7, reviews: 0,
    badge: "Handcrafted", img: crochet, category: "Handcrafted Crochet", occasion: "Rakhi",
    categorySlug: "crochet", subSlug: "keychains",
    description: "Playful handmade crochet keychains, perfect as return gifts or everyday accessories.",
  },
  {
    id: "p11", name: "Hawan Samagri Complete Kit", price: 799, rating: 4.8, reviews: 0,
    img: poojakit, category: "Pooja Kits", occasion: "Hawan",
    categorySlug: "pooja-rituals", subSlug: "pooja-samagri",
    description: "Pure samagri set for hawan and home rituals, sourced from trusted suppliers.",
  },
  {
    id: "p12", name: "Moti Mala for Bhagwan Ji", price: 349, rating: 4.6, reviews: 0,
    img: mala, category: "Mala & Chadhava", occasion: "Navratri",
    categorySlug: "mala-accessories-handmade", subSlug: "moti-mala",
    description: "Pure moti mala for deity offerings and puja decoration.",
  },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
