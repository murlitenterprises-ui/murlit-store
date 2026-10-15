import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as queries from "../queries/catalog";

export const getNavCategories = createServerFn().handler(() =>
  queries.getNavCategories()
);

export const getCategoryBySlug = createServerFn()
  .validator(z.object({ slug: z.string() }))
  .handler(({ data }) => queries.getCategoryBySlug(data.slug));

const listProductsSchema = z.object({
  categorySlug: z.string().optional(),
  subSlug: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  badge: z.string().optional(),
  featured: z.boolean().optional(),
  sort: z.enum(["featured", "newest", "price_asc", "price_desc", "name"]).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export const listProducts = createServerFn()
  .validator(listProductsSchema)
  .handler(({ data }) => queries.listProducts(data));

export const getProductBySlug = createServerFn()
  .validator(z.object({ slug: z.string() }))
  .handler(({ data }) => queries.getProductBySlug(data.slug));

export const searchProducts = createServerFn()
  .validator(z.object({ q: z.string(), limit: z.number().optional() }))
  .handler(({ data }) => queries.searchProducts(data.q, data.limit));
