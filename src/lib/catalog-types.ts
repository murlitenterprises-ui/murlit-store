// Shared types for catalog data — safe to import in client code
// (These are re-exports from server/queries/catalog.ts but without the DB imports)

export type CategoryTree = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  sortOrder: number;
  children: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    sortOrder: number;
  }[];
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  mrp: number | null;
  sku: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  badge: string | null;
  categoryId: string | null;
  tags: string[];
  occasions: string[];
  materials: string | null;
  weight: string | null;
  dimensions: string | null;
  hsnCode: string | null;
  gstRate: number;
  createdAt: Date;
  imageUrl: string | null;
};
