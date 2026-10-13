import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

type Item = string | { label: string; q?: string; price?: number; to?: "/" ; hash?: string };

const groups: { title: string; items: Item[] }[] = [
  { title: "Pooja & Rituals", items: ["Pooja Kits", "Pooja Samagri", "Pooja Thali", "Aarti Sets", "Pooja Chowki", "Kalash", "Panchpatra", "Murti & Idols", "Pooja Mandir", "Diya", "Batti", "Dhoop", "Agarbatti", "Rudraksha", "Yantra", "Havan Samagri", "Satyanarayan Pooja Kit", "Griha Pravesh Kit", "Diwali Pooja Kit", "Navgrah Pooja Kit", "Rudrabhishek Kit"] },
  { title: "Wedding Essentials", items: ["Wedding Pooja Samagri", "Wedding Potli", "Batua", "Shagun Thali", "Shagun Box", "Tilak Thali", "Roka Gifts", "Ring Ceremony Trays", "Bridal Accessories", "Groom Accessories", "Dulha-Dulhan Items", "Varmala", "Fancy Nariyal", "Decorative Kalash", "Mangalashtak", "Complete Wedding Kits"] },
  { title: "Wedding Décor & Gifting", items: ["Haldi Décor", "Mehendi Décor", "Sangeet Décor", "Welcome Trays", "Decorative Plates", "Dry Fruit Plates", "Dry Fruit Boxes", "Mithai Boxes", "Return Gifts", "Wedding Hampers", "Gift Hampers", "Decorative Chowki", "Wedding Trays", "Festival Gifts"] },
  { title: "Mala & Chadhava", items: ["Elaichi Mala", "Moti Mala", "Laung Mala", "Dry Fruit Mala", "Bhagwan Ji Ki Mala", "Rudraksha Mala", "Tulsi Mala", "Flower Mala", "Handmade Mala", "Decorative Varmala"] },
  { title: "Handcrafted & Crochet", items: ["Crochet Jewellery", "Crochet Bags", "Crochet Flowers", "Crochet Varmala", "Crochet Keychains", "Table Tops", "Handmade Décor", "Handmade Gifts", "Crochet Rakhi", "Crochet Accessories", "Handcrafted Jewellery", "One-of-a-kind Creations"] },
  { title: "Customized Products", items: ["Customized Pooja Kits", "Customized Wedding Kits", "Personalized Potli", "Customized Mala", "Customized Varmala", "Customized Plates", "Customized Kalash", "Customized Return Gifts", "Personalized Gift Boxes", "Customized Packaging", "Logo-Based Gifts"] },
  { title: "B2B & Wholesale", items: ["Wholesale Pooja Products", "Bulk Wedding Essentials", "Wedding Planner Supplies", "Event Planner Supplies", "Retailer Orders", "Reseller Products", "Corporate Gifting", "Temple Supplies", "Private Label Packaging", "International Bulk Orders"] },
  { title: "Shop by Occasion", items: ["Wedding", "Vivah", "Haldi", "Mehendi", "Sangeet", "Engagement", "Roka", "Reception", "Diwali", "Navratri", "Rakhi", "Karwa Chauth", "Hawan", "Sundarkand", "Griha Pravesh", "Janam Sanskar", "Mundan", "Namkaran", "Ganesh Chaturthi", "Janmashtami"] },
  { title: "Shop by Budget", items: [
    { label: "Products Under ₹499", price: 0 }, { label: "Products ₹500–₹999", price: 1 },
    { label: "Products ₹1,000–₹2,999", price: 2 }, { label: "Premium Gifts ₹3,000+", price: 3 }] },
  { title: "Customer Support & Information", items: [
    { label: "About Us", to: "/", hash: "story" }, { label: "Contact Us", to: "/", hash: "contact" },
    { label: "Track Order", to: "/", hash: "contact" }, { label: "FAQs", to: "/", hash: "contact" },
    { label: "Shipping & Delivery", to: "/", hash: "contact" }, { label: "Returns & Refunds", to: "/", hash: "contact" },
    { label: "Privacy Policy", to: "/", hash: "contact" }, { label: "Terms & Conditions", to: "/", hash: "contact" },
    { label: "Custom Order Enquiry", to: "/", hash: "custom" }, { label: "Bulk Order Enquiry", to: "/", hash: "b2b" },
    { label: "Blog", to: "/", hash: "story" }, { label: "Gallery", to: "/", hash: "gallery" }] },
];

function ItemLink({ it }: { it: Item }) {
  const cls = "text-[13px] leading-6 text-muted-foreground transition-colors hover:text-maroon";
  if (typeof it === "string") return <Link to="/shop" search={{ q: it }} className={cls}>{it}</Link>;
  if (it.to) return <Link to={it.to} hash={it.hash} className={cls}>{it.label}</Link>;
  return <Link to="/shop" search={{ price: it.price }} className={cls}>{it.label}</Link>;
}

const label = (it: Item) => (typeof it === "string" ? it : it.label);

export function SeoLinks() {
  return (
    <section aria-labelledby="seo-links-title" className="border-t bg-sage">
      <div className="container-x py-12">
        <h2 id="seo-links-title" className="font-display text-2xl text-burgundy">Explore Murlit Enterprises</h2>
        <p className="mt-1 text-sm text-muted-foreground">Browse every collection, occasion and service in one place.</p>

        {/* Desktop: columns */}
        <div className="mt-8 hidden gap-x-10 gap-y-10 md:grid md:grid-cols-3 lg:grid-cols-5">
          {groups.map((g) => (
            <nav key={g.title} aria-label={g.title} className="border-t border-border pt-4">
              <h3 className="mb-2 font-sans text-xs font-bold uppercase tracking-widest text-ink">{g.title}</h3>
              <ul className="flex flex-wrap gap-x-1">
                {g.items.map((it, i) => (
                  <li key={label(it)} className="after:text-border after:content-['|'] last:after:content-none">
                    <ItemLink it={it} />{i < g.items.length - 1 && " "}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Mobile: collapsible */}
        <div className="mt-6 divide-y border-y md:hidden">
          {groups.map((g) => (
            <details key={g.title} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-bold">
                {g.title}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-4">
                {g.items.map((it) => <li key={label(it)}><ItemLink it={it} /></li>)}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
