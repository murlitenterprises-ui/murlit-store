import { img } from "@/lib/catalog";

export type SubItem = {
  label: string;
  img: string;
  href: string;
  subSlug: string;
};

export type MenuColumn = {
  title: string;
  img: string;
  links: SubItem[];
  sub?: string;
  slug?: string;
};

export const shopMenuColumns: MenuColumn[] = [
  {
    title: "Pooja & Rituals",
    slug: "pooja-rituals",
    img: img.poojakit,
    sub: "Janam · Vivah · Hawan · Sundarkand · Diwali · Satyanarayan · Griha Pravesh · Navgrah · Rudrabhishek · Vastu Shanti · Vahan · Dukaan",
    links: [
      { label: "Pooja Kits",                       img: img.poojakit, subSlug: "pooja-kits",                  href: "/category/pooja-rituals?sub=pooja-kits" },
      { label: "Pooja Samagri",                     img: img.poojakit, subSlug: "pooja-samagri",               href: "/category/pooja-rituals?sub=pooja-samagri" },
      { label: "Pooja Chowki & Aasan",              img: img.poojakit, subSlug: "pooja-chowki-aasan",          href: "/category/pooja-rituals?sub=pooja-chowki-aasan" },
      { label: "Pooja Thali & Aarti Set",           img: img.poojakit, subSlug: "pooja-thali-aarti-set",       href: "/category/pooja-rituals?sub=pooja-thali-aarti-set" },
      { label: "Kalash & Panchpatra",               img: img.diwali,   subSlug: "kalash-panchpatra",           href: "/category/pooja-rituals?sub=kalash-panchpatra" },
      { label: "Murti & Idols",                     img: img.poojakit, subSlug: "murti-idols",                 href: "/category/pooja-rituals?sub=murti-idols" },
      { label: "Pooja Mandir & Singhasan",          img: img.poojakit, subSlug: "pooja-mandir-singhasan",      href: "/category/pooja-rituals?sub=pooja-mandir-singhasan" },
      { label: "Diya, Batti, Dhoop & Agarbatti",   img: img.diwali,   subSlug: "diya-batti-dhoop-agarbatti",  href: "/category/pooja-rituals?sub=diya-batti-dhoop-agarbatti" },
      { label: "Yantra & Rudraksha",                img: img.mala,     subSlug: "yantra-rudraksha",            href: "/category/pooja-rituals?sub=yantra-rudraksha" },
    ],
  },
  {
    title: "Wedding Essentials",
    slug: "wedding-essentials",
    img: img.wedding,
    links: [
      { label: "Wedding Pooja Samagri",             img: img.poojakit, subSlug: "wedding-pooja-samagri",       href: "/category/wedding-essentials?sub=wedding-pooja-samagri" },
      { label: "Padle ka Saman",                    img: img.wedding,  subSlug: "padle-ka-saman",              href: "/category/wedding-essentials?sub=padle-ka-saman" },
      { label: "Batisi ka Saman",                   img: img.wedding,  subSlug: "batisi-ka-saman",             href: "/category/wedding-essentials?sub=batisi-ka-saman" },
      { label: "Shagun Envelopes, Boxes & Thalis",  img: img.hamper,   subSlug: "shagun-envelopes-boxes-thalis", href: "/category/wedding-essentials?sub=shagun-envelopes-boxes-thalis" },
      { label: "Wedding Potli & Batua",             img: img.wedding,  subSlug: "wedding-potli-batua",         href: "/category/wedding-essentials?sub=wedding-potli-batua" },
      { label: "Decorative Chowki",                 img: img.wedding,  subSlug: "decorative-chowki",           href: "/category/wedding-essentials?sub=decorative-chowki" },
      { label: "Wedding Thali",                     img: img.wedding,  subSlug: "wedding-thali",               href: "/category/wedding-essentials?sub=wedding-thali" },
      { label: "Tilak, Roka & Ring Trays",          img: img.hamper,   subSlug: "tilak-roka-ring-trays",       href: "/category/wedding-essentials?sub=tilak-roka-ring-trays" },
      { label: "Dulha-Dulhan Accessories",          img: img.wedding,  subSlug: "dulha-dulhan-accessories",    href: "/category/wedding-essentials?sub=dulha-dulhan-accessories" },
      { label: "Bridal Accessories",                img: img.mehendi,  subSlug: "bridal-accessories",          href: "/category/wedding-essentials?sub=bridal-accessories" },
      { label: "Groom Accessories",                 img: img.mala,     subSlug: "groom-accessories",           href: "/category/wedding-essentials?sub=groom-accessories" },
    ],
  },
  {
    title: "Wedding Décor & Gifting",
    slug: "wedding-decor-gifting",
    img: img.hamper,
    links: [
      { label: "Fancy Nariyal",                     img: img.diwali,   subSlug: "fancy-nariyal",               href: "/category/wedding-decor-gifting?sub=fancy-nariyal" },
      { label: "Dry Fruit Plates",                  img: img.hamper,   subSlug: "dry-fruit-plates",            href: "/category/wedding-decor-gifting?sub=dry-fruit-plates" },
      { label: "Decorative Plates & Trays",         img: img.hamper,   subSlug: "decorative-plates-trays",     href: "/category/wedding-decor-gifting?sub=decorative-plates-trays" },
      { label: "Decorative Kalash",                 img: img.diwali,   subSlug: "decorative-kalash",           href: "/category/wedding-decor-gifting?sub=decorative-kalash" },
      { label: "Welcome / Swagat Items",            img: img.wedding,  subSlug: "welcome-swagat-items",        href: "/category/wedding-decor-gifting?sub=welcome-swagat-items" },
      { label: "Haldi, Mehendi & Sangeet Décor",   img: img.haldi,    subSlug: "haldi-mehendi-sangeet-decor", href: "/category/wedding-decor-gifting?sub=haldi-mehendi-sangeet-decor" },
      { label: "Return Gifts",                      img: img.hamper,   subSlug: "return-gifts",                href: "/category/wedding-decor-gifting?sub=return-gifts" },
      { label: "Gift Hampers",                      img: img.hamper,   subSlug: "gift-hampers",                href: "/category/wedding-decor-gifting?sub=gift-hampers" },
      { label: "Dry Fruit Boxes & Mithai Boxes",   img: img.hamper,   subSlug: "dry-fruit-mithai-boxes",      href: "/category/wedding-decor-gifting?sub=dry-fruit-mithai-boxes" },
    ],
  },
  {
    title: "Crochet",
    slug: "crochet",
    img: img.crochet,
    links: [
      { label: "Crochet Flowers & Bouquets",          img: img.crochet,  subSlug: "flowers-bouquets",          href: "/category/crochet?sub=flowers-bouquets" },
      { label: "Crochet Toran & Bandhanwar",           img: img.crochet,  subSlug: "toran-bandhanwar",          href: "/category/crochet?sub=toran-bandhanwar" },
      { label: "Crochet Jewellery",                    img: img.crochet,  subSlug: "jewellery",                 href: "/category/crochet?sub=jewellery" },
      { label: "Crochet Keychains",                    img: img.crochet,  subSlug: "keychains",                 href: "/category/crochet?sub=keychains" },
      { label: "Crochet Varmala",                      img: img.wedding,  subSlug: "varmala",                   href: "/category/crochet?sub=varmala" },
      { label: "Crochet Bags & Potlis",                img: img.hamper,   subSlug: "bags-potlis",               href: "/category/crochet?sub=bags-potlis" },
      { label: "Crochet Hair Accessories",             img: img.crochet,  subSlug: "hair-accessories",          href: "/category/crochet?sub=hair-accessories" },
      { label: "Laddu Gopal Crochet Poshak",           img: img.poojakit, subSlug: "laddu-gopal-poshak",        href: "/category/crochet?sub=laddu-gopal-poshak" },
      { label: "Crochet Pooja Aasan & Mats",           img: img.poojakit, subSlug: "pooja-aasan-mats",          href: "/category/crochet?sub=pooja-aasan-mats" },
      { label: "Crochet Diya & Kalash Covers",         img: img.diwali,   subSlug: "diya-kalash-covers",        href: "/category/crochet?sub=diya-kalash-covers" },
      { label: "Crochet Table Mats & Coasters",        img: img.crochet,  subSlug: "table-mats-coasters",       href: "/category/crochet?sub=table-mats-coasters" },
      { label: "Crochet Wall Hangings & Dreamcatchers",img: img.crochet,  subSlug: "wall-hangings-dreamcatchers",href: "/category/crochet?sub=wall-hangings-dreamcatchers" },
      { label: "Crochet Toys & Amigurumi",             img: img.crochet,  subSlug: "toys-amigurumi",            href: "/category/crochet?sub=toys-amigurumi" },
      { label: "Crochet Baby Sets & Booties",          img: img.crochet,  subSlug: "baby-sets-booties",         href: "/category/crochet?sub=baby-sets-booties" },
      { label: "Crochet Cushion Covers",               img: img.crochet,  subSlug: "cushion-covers",            href: "/category/crochet?sub=cushion-covers" },
      { label: "Crochet Bottle & Phone Covers",        img: img.crochet,  subSlug: "bottle-phone-covers",       href: "/category/crochet?sub=bottle-phone-covers" },
      { label: "Crochet Gift Hampers",                 img: img.hamper,   subSlug: "gift-hampers",              href: "/category/crochet?sub=gift-hampers" },
      { label: "Custom Crochet Orders",                img: img.crochet,  subSlug: "custom-orders",             href: "/category/crochet?sub=custom-orders" },
    ],
  },
  {
    title: "Mala, Accessories & Handmade",
    slug: "mala-accessories-handmade",
    img: img.mala,
    links: [
      { label: "Elaichi Mala",                      img: img.mala,     subSlug: "elaichi-mala",                href: "/category/mala-accessories-handmade?sub=elaichi-mala" },
      { label: "Moti Mala",                         img: img.mala,     subSlug: "moti-mala",                   href: "/category/mala-accessories-handmade?sub=moti-mala" },
      { label: "Laung Mala",                        img: img.mala,     subSlug: "laung-mala",                  href: "/category/mala-accessories-handmade?sub=laung-mala" },
      { label: "Dry Fruit Mala",                    img: img.mala,     subSlug: "dry-fruit-mala",              href: "/category/mala-accessories-handmade?sub=dry-fruit-mala" },
      { label: "Bhagwan Ji Ki Mala / Chadhava",     img: img.mala,     subSlug: "bhagwan-ji-ki-mala",          href: "/category/mala-accessories-handmade?sub=bhagwan-ji-ki-mala" },
      { label: "Brooch & Bracelet",                 img: img.crochet,  subSlug: "brooch-bracelet",             href: "/category/mala-accessories-handmade?sub=brooch-bracelet" },
      { label: "Crochet Jewellery",                 img: img.crochet,  subSlug: "crochet-jewellery",           href: "/category/mala-accessories-handmade?sub=crochet-jewellery" },
      { label: "Varmala",                           img: img.wedding,  subSlug: "varmala",                     href: "/category/mala-accessories-handmade?sub=varmala" },
      { label: "Keychains",                         img: img.crochet,  subSlug: "keychains",                   href: "/category/mala-accessories-handmade?sub=keychains" },
      { label: "Table Tops",                        img: img.crochet,  subSlug: "table-tops",                  href: "/category/mala-accessories-handmade?sub=table-tops" },
      { label: "Bags",                              img: img.crochet,  subSlug: "bags",                        href: "/category/mala-accessories-handmade?sub=bags" },
      { label: "Handmade Décor",                    img: img.crochet,  subSlug: "handmade-decor",              href: "/category/mala-accessories-handmade?sub=handmade-decor" },
    ],
  },
];

export const weddingMenuColumns: MenuColumn[] = [
  { title: "Wedding / Vivah", img: img.wedding,
    links: [
      { label: "Vivah Pooja Kit",      img: img.poojakit, subSlug: "wedding-pooja-samagri", href: "/category/wedding-essentials?sub=wedding-pooja-samagri" },
      { label: "Mandap Essentials",    img: img.wedding,  subSlug: "padle-ka-saman",        href: "/category/wedding-essentials?sub=padle-ka-saman" },
      { label: "Kanyadaan Items",      img: img.wedding,  subSlug: "batisi-ka-saman",       href: "/category/wedding-essentials?sub=batisi-ka-saman" },
    ] },
  { title: "Haldi", img: img.haldi,
    links: [
      { label: "Haldi Trays",  img: img.haldi,   subSlug: "decorative-plates-trays",    href: "/category/wedding-decor-gifting?sub=decorative-plates-trays" },
      { label: "Haldi Décor",  img: img.haldi,   subSlug: "haldi-mehendi-sangeet-decor", href: "/category/wedding-decor-gifting?sub=haldi-mehendi-sangeet-decor" },
      { label: "Ubtan Bowls",  img: img.haldi,   subSlug: "decorative-plates-trays",    href: "/category/wedding-decor-gifting?sub=decorative-plates-trays" },
    ] },
  { title: "Mehendi", img: img.mehendi,
    links: [
      { label: "Mehendi Platters", img: img.mehendi, subSlug: "decorative-plates-trays", href: "/category/wedding-decor-gifting?sub=decorative-plates-trays" },
      { label: "Guest Favours",    img: img.hamper,  subSlug: "return-gifts",            href: "/category/wedding-decor-gifting?sub=return-gifts" },
      { label: "Floral Props",     img: img.mehendi, subSlug: "welcome-swagat-items",    href: "/category/wedding-decor-gifting?sub=welcome-swagat-items" },
    ] },
  { title: "Sangeet", img: img.crochet,
    links: [
      { label: "Décor Accents",  img: img.crochet, subSlug: "handmade-decor",   href: "/category/mala-accessories-handmade?sub=handmade-decor" },
      { label: "Return Gifts",   img: img.hamper,  subSlug: "return-gifts",     href: "/category/wedding-decor-gifting?sub=return-gifts" },
      { label: "Props",          img: img.crochet, subSlug: "welcome-swagat-items", href: "/category/wedding-decor-gifting?sub=welcome-swagat-items" },
    ] },
  { title: "Engagement / Roka / Ring", img: img.mala,
    links: [
      { label: "Ring Trays",    img: img.mala,   subSlug: "tilak-roka-ring-trays",           href: "/category/wedding-essentials?sub=tilak-roka-ring-trays" },
      { label: "Roka Thali",    img: img.hamper, subSlug: "shagun-envelopes-boxes-thalis",   href: "/category/wedding-essentials?sub=shagun-envelopes-boxes-thalis" },
      { label: "Shagun Boxes",  img: img.hamper, subSlug: "shagun-envelopes-boxes-thalis",   href: "/category/wedding-essentials?sub=shagun-envelopes-boxes-thalis" },
    ] },
  { title: "Tilak / Sagai", img: img.hamper,
    links: [
      { label: "Tilak Thali",       img: img.hamper, subSlug: "tilak-roka-ring-trays",         href: "/category/wedding-essentials?sub=tilak-roka-ring-trays" },
      { label: "Sagai Hampers",     img: img.hamper, subSlug: "gift-hampers",                  href: "/category/wedding-decor-gifting?sub=gift-hampers" },
      { label: "Dry Fruit Plates",  img: img.hamper, subSlug: "dry-fruit-plates",              href: "/category/wedding-decor-gifting?sub=dry-fruit-plates" },
    ] },
  { title: "Baraat / Welcome", img: img.diwali,
    links: [
      { label: "Swagat Items",      img: img.wedding, subSlug: "welcome-swagat-items", href: "/category/wedding-decor-gifting?sub=welcome-swagat-items" },
      { label: "Welcome Garlands",  img: img.mala,    subSlug: "varmala",              href: "/category/mala-accessories-handmade?sub=varmala" },
      { label: "Ittar Sets",        img: img.diwali,  subSlug: "fancy-nariyal",        href: "/category/wedding-decor-gifting?sub=fancy-nariyal" },
    ] },
  { title: "Reception", img: img.hamper,
    links: [
      { label: "Guest Hampers",   img: img.hamper,  subSlug: "gift-hampers",     href: "/category/wedding-decor-gifting?sub=gift-hampers" },
      { label: "Table Décor",     img: img.crochet, subSlug: "table-tops",       href: "/category/mala-accessories-handmade?sub=table-tops" },
      { label: "Thank-you Gifts", img: img.hamper,  subSlug: "return-gifts",     href: "/category/wedding-decor-gifting?sub=return-gifts" },
    ] },
];
