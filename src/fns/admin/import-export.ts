// Server-only — never import this from client code
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, products, productImages, categories } from "@/server/db";
import { eq, inArray, asc } from "drizzle-orm";
import * as XLSX from "xlsx";

// ─── Column definitions ───────────────────────────────────────────────────────

const TEMPLATE_COLUMNS = [
  "sku", "name", "category_slug", "price_rs", "mrp_rs", "stock",
  "short_description", "description", "hsn_code", "gst_rate",
  "price_includes_gst", "is_active", "is_featured",
  "tags", "image_urls", "seo_title", "seo_description",
];

const HELP_ROWS = [
  ["Column", "Required", "Description"],
  ["sku", "Yes", "Unique product code (letters, numbers, hyphens). If a product with this SKU exists it will be updated."],
  ["name", "Yes", "Product display name (max 200 chars)."],
  ["category_slug", "Yes", "Category identifier from the Categories sheet."],
  ["price_rs", "Yes", "Selling price in rupees (e.g. 299). Stored in paise internally."],
  ["mrp_rs", "No", "Maximum retail price in rupees. Must be >= price_rs if provided."],
  ["stock", "No", "Number of units available (whole number, default 0)."],
  ["short_description", "No", "One-line product description shown in listings."],
  ["description", "No", "Full product description (plain text or simple HTML)."],
  ["hsn_code", "No", "GST Harmonised System of Nomenclature code (e.g. 4901)."],
  ["gst_rate", "No", "GST percentage: 0, 5, 12, 18, or 28. Default 5."],
  ["price_includes_gst", "No", "yes or no. Does price_rs include GST? Default yes."],
  ["is_active", "No", "yes or no. Show on store? Default yes."],
  ["is_featured", "No", "yes or no. Show in featured section? Default no."],
  ["tags", "No", "Comma-separated tags (e.g. wedding,diwali,gift)."],
  ["image_urls", "No", "Comma-separated full image URLs. Cloudinary URLs are used directly; others are uploaded."],
  ["seo_title", "No", "Custom page title for search engines (max 70 chars)."],
  ["seo_description", "No", "Meta description for search engines (max 160 chars)."],
];

// ─── Download template ────────────────────────────────────────────────────────

export const downloadTemplate = createServerFn().handler(async () => {
  await requireAdmin();

  const allCats = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.name));

  const wb = XLSX.utils.book_new();

  // Products sheet with header + 2 example rows
  const exampleRows = [
    ["TEST-001", "Handcrafted Pooja Thali", allCats[0]?.slug ?? "pooja-rituals", 599, 799, 10,
     "Beautiful brass thali", "Full description here", "4419", 5, "yes", "yes", "no",
     "pooja,brass,handcrafted", "", "Handcrafted Pooja Thali | Murlit", "Premium pooja thali"],
    ["TEST-002", "Wedding Gift Hamper", allCats[1]?.slug ?? "wedding", 1299, "", 5,
     "Curated wedding hamper", "", "", 12, "yes", "yes", "yes",
     "wedding,gift", "", "", ""],
  ];
  const productWsData = [TEMPLATE_COLUMNS, ...exampleRows];
  const productWs = XLSX.utils.aoa_to_sheet(productWsData);
  // Set column widths
  productWs["!cols"] = TEMPLATE_COLUMNS.map((c) =>
    c === "description" || c === "image_urls" ? { wch: 40 } : { wch: 20 }
  );
  XLSX.utils.book_append_sheet(wb, productWs, "Products");

  // Categories sheet
  const catWsData = [
    ["slug", "name"],
    ...allCats.map((c) => [c.slug, c.name]),
  ];
  const catWs = XLSX.utils.aoa_to_sheet(catWsData);
  catWs["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, catWs, "Categories");

  // Help sheet
  const helpWs = XLSX.utils.aoa_to_sheet(HELP_ROWS);
  helpWs["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, helpWs, "Help");

  const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  return buf as string;
});

// ─── Parse + validate uploaded file ──────────────────────────────────────────

const VALID_GST = new Set([0, 5, 12, 18, 28]);

function parseYesNo(val: unknown, def: boolean): boolean {
  if (val === undefined || val === null || val === "") return def;
  const s = String(val).trim().toLowerCase();
  if (s === "yes" || s === "true" || s === "1") return true;
  if (s === "no" || s === "false" || s === "0") return false;
  return def;
}

function parseNum(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export interface PreviewRow {
  rowNum: number;
  sku: string;
  name: string;
  categorySlug: string;
  priceRs: number | null;
  mrpRs: number | null;
  stock: number;
  shortDescription: string;
  description: string;
  hsnCode: string;
  gstRate: number;
  priceIncludesGst: boolean;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  imageUrls: string[];
  seoTitle: string;
  seoDescription: string;
  isUpdate: boolean;
  existingId: string | null;
  errors: string[];
  valid: boolean;
}

export const previewImport = createServerFn({ method: "POST" })
  .validator(z.object({ fileBase64: z.string(), fileName: z.string() }))
  .handler(async ({ data }): Promise<{ rows: PreviewRow[]; totalValid: number; totalErrors: number }> => {
    await requireAdmin();

    const { fileBase64, fileName } = data;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      throw new Error("File must be .xlsx, .xls, or .csv");
    }

    // Check file size (base64 ~4/3 of binary)
    if (fileBase64.length > 2_800_000) throw new Error("File too large (max 2 MB)");

    // Parse workbook
    const buf = Buffer.from(fileBase64, "base64");
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buf, { type: "buffer" });
    } catch {
      throw new Error("Could not read file — make sure it is a valid Excel or CSV file");
    }

    // Use first sheet
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: "",
      raw: false,
    });

    if (rawRows.length === 0) throw new Error("File has no data rows");
    if (rawRows.length > 1000) throw new Error("Too many rows (max 1000)");

    // Load categories and existing SKUs
    const allCats = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories);
    const catBySlug = new Map(allCats.map((c) => [c.slug, c.id]));

    const existingProds = await db
      .select({ id: products.id, sku: products.sku })
      .from(products);
    const existingBySku = new Map(existingProds.map((p) => [p.sku.toUpperCase(), p.id]));

    // Track duplicate SKUs within file
    const seenSkus = new Map<string, number>();

    const rows: PreviewRow[] = rawRows.map((raw, idx) => {
      const rowNum = idx + 2; // +2 because header is row 1
      const errors: string[] = [];

      const sku = String(raw.sku ?? "").trim();
      const name = String(raw.name ?? "").trim();
      const categorySlug = String(raw.category_slug ?? "").trim();
      const priceRs = parseNum(raw.price_rs);
      const mrpRs = parseNum(raw.mrp_rs);
      const stockRaw = parseNum(raw.stock);
      const stock = stockRaw !== null ? Math.max(0, Math.round(stockRaw)) : 0;
      const gstRaw = parseNum(raw.gst_rate);
      const gstRate = gstRaw !== null ? Math.round(gstRaw) : 5;
      const imageUrlsRaw = String(raw.image_urls ?? "").trim();
      const tagsRaw = String(raw.tags ?? "").trim();

      // Determine if this is an update (SKU already exists)
      const isUpdateCheck = sku ? existingBySku.has(sku.toUpperCase()) : false;

      // Required fields (name/category/price only required for new products)
      if (!sku) errors.push("sku is required");
      if (!isUpdateCheck && !name) errors.push("name is required");
      if (!isUpdateCheck && !categorySlug) errors.push("category_slug is required");
      if (!isUpdateCheck && priceRs === null) errors.push("price_rs is required and must be a number");
      else if (priceRs !== null && priceRs < 0) errors.push("price_rs must be >= 0");

      // Duplicate SKU in file
      if (sku) {
        const skuKey = sku.toUpperCase();
        if (seenSkus.has(skuKey)) {
          errors.push(`Duplicate SKU in file (also in row ${seenSkus.get(skuKey)})`);
        } else {
          seenSkus.set(skuKey, rowNum);
        }
      }

      // Category
      if (categorySlug && !catBySlug.has(categorySlug)) {
        errors.push(`Unknown category_slug "${categorySlug}"`);
      }

      // MRP
      if (mrpRs !== null && priceRs !== null && mrpRs < priceRs) {
        errors.push("mrp_rs must be >= price_rs");
      }

      // GST rate — only validate when non-empty; default to 5 if blank
      const gstInput = String(raw.gst_rate ?? "").trim();
      if (gstInput !== "" && !VALID_GST.has(gstRate)) {
        errors.push(`gst_rate must be 0, 5, 12, 18, or 28 (got ${raw.gst_rate})`);
      }

      // Image URLs — basic URL validation (skip for update rows; existing images stay in DB)
      const imageUrls = imageUrlsRaw
        ? imageUrlsRaw.split(",").map((u) => u.trim()).filter(Boolean)
        : [];
      if (!isUpdateCheck) {
        for (const u of imageUrls) {
          try {
            new URL(u);
          } catch {
            errors.push(`Invalid image URL: "${u.slice(0, 50)}"`);
          }
        }
      }

      const existingId = sku ? (existingBySku.get(sku.toUpperCase()) ?? null) : null;

      return {
        rowNum,
        sku,
        name,
        categorySlug,
        priceRs,
        mrpRs,
        stock,
        shortDescription: String(raw.short_description ?? "").trim(),
        description: String(raw.description ?? "").trim(),
        hsnCode: String(raw.hsn_code ?? "").trim(),
        gstRate: VALID_GST.has(gstRate) ? gstRate : 5,
        priceIncludesGst: parseYesNo(raw.price_includes_gst, true),
        isActive: parseYesNo(raw.is_active, true),
        isFeatured: parseYesNo(raw.is_featured, false),
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
        imageUrls,
        seoTitle: String(raw.seo_title ?? "").trim(),
        seoDescription: String(raw.seo_description ?? "").trim(),
        isUpdate: !!existingId,
        existingId,
        errors,
        valid: errors.length === 0,
      };
    });

    const totalValid = rows.filter((r) => r.valid).length;
    const totalErrors = rows.filter((r) => !r.valid).length;
    return { rows, totalValid, totalErrors };
  });

// ─── Execute import ───────────────────────────────────────────────────────────

async function slugFromName(name: string, existingSlugs: Set<string>): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  let slug = base;
  let i = 1;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${i++}`;
  }
  existingSlugs.add(slug);
  return slug;
}

async function uploadImageToCloudinary(url: string): Promise<{ url: string; publicId: string | null } | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: url,
          upload_preset: undefined,
          api_key: apiKey,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { secure_url?: string; public_id?: string };
    if (!data.secure_url) return null;
    return { url: data.secure_url, publicId: data.public_id ?? null };
  } catch {
    return null;
  }
}

export const executeImport = createServerFn({ method: "POST" })
  .validator(
    z.object({
      rows: z.array(
        z.object({
          rowNum: z.number(),
          sku: z.string(),
          name: z.string(),
          categorySlug: z.string(),
          priceRs: z.number(),
          mrpRs: z.number().nullable(),
          stock: z.number(),
          shortDescription: z.string(),
          description: z.string(),
          hsnCode: z.string(),
          gstRate: z.number(),
          priceIncludesGst: z.boolean(),
          isActive: z.boolean(),
          isFeatured: z.boolean(),
          tags: z.array(z.string()),
          imageUrls: z.array(z.string()),
          seoTitle: z.string(),
          seoDescription: z.string(),
          isUpdate: z.boolean(),
          existingId: z.string().nullable(),
          errors: z.array(z.string()),
          valid: z.boolean(),
        })
      ),
    })
  )
  .handler(async ({ data: { rows } }) => {
    await requireAdmin();

    const validRows = rows.filter((r) => r.valid);
    if (!validRows.length) return { created: 0, updated: 0, skipped: 0, warnings: [] as string[] };

    const allCats = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories);
    const catBySlug = new Map(allCats.map((c) => [c.slug, c.id]));

    // Load all existing slugs to avoid collisions
    const allSlugs = await db.select({ slug: products.slug }).from(products);
    const existingSlugs = new Set(allSlugs.map((r) => r.slug));

    let created = 0;
    let updated = 0;
    const warnings: string[] = [];

    for (const row of validRows) {
      const categoryId = catBySlug.get(row.categorySlug) ?? null;
      const pricePaise = Math.round(row.priceRs * 100);
      const mrpPaise = row.mrpRs !== null ? Math.round(row.mrpRs * 100) : null;

      // Process images
      const imageRecords: Array<{ url: string; publicId: string | null; sortOrder: number }> = [];
      for (let i = 0; i < row.imageUrls.length; i++) {
        const u = row.imageUrls[i];
        if (u.includes("cloudinary.com")) {
          imageRecords.push({ url: u, publicId: null, sortOrder: i });
        } else {
          const uploaded = await uploadImageToCloudinary(u);
          if (uploaded) {
            imageRecords.push({ url: uploaded.url, publicId: uploaded.publicId, sortOrder: i });
          } else {
            warnings.push(`Row ${row.rowNum} (${row.sku}): could not upload image "${u.slice(0, 60)}", skipped`);
            // Use url as-is if upload fails
            imageRecords.push({ url: u, publicId: null, sortOrder: i });
          }
        }
      }

      if (row.isUpdate && row.existingId) {
        // Update existing product
        await db.update(products).set({
          name: row.name,
          shortDescription: row.shortDescription || null,
          description: row.description || null,
          price: pricePaise,
          mrp: mrpPaise,
          sku: row.sku,
          stock: row.stock,
          isActive: row.isActive,
          isFeatured: row.isFeatured,
          categoryId,
          tags: row.tags,
          hsnCode: row.hsnCode || null,
          gstRate: row.gstRate,
          priceIncludesGst: row.priceIncludesGst,
          seoTitle: row.seoTitle || null,
          seoDescription: row.seoDescription || null,
          updatedAt: new Date(),
        }).where(eq(products.id, row.existingId));

        if (imageRecords.length > 0) {
          await db.delete(productImages).where(eq(productImages.productId, row.existingId));
          await db.insert(productImages).values(
            imageRecords.map((img) => ({
              productId: row.existingId!,
              url: img.url,
              publicId: img.publicId,
              sortOrder: img.sortOrder,
            }))
          );
        }
        updated++;
      } else {
        // Create new product
        const slug = await slugFromName(row.name, existingSlugs);
        const [newProduct] = await db.insert(products).values({
          name: row.name,
          slug,
          shortDescription: row.shortDescription || null,
          description: row.description || null,
          price: pricePaise,
          mrp: mrpPaise,
          sku: row.sku,
          stock: row.stock,
          isActive: row.isActive,
          isFeatured: row.isFeatured,
          categoryId,
          tags: row.tags,
          hsnCode: row.hsnCode || null,
          gstRate: row.gstRate,
          priceIncludesGst: row.priceIncludesGst,
          seoTitle: row.seoTitle || null,
          seoDescription: row.seoDescription || null,
        }).returning({ id: products.id });

        if (imageRecords.length > 0) {
          await db.insert(productImages).values(
            imageRecords.map((img) => ({
              productId: newProduct.id,
              url: img.url,
              publicId: img.publicId,
              sortOrder: img.sortOrder,
            }))
          );
        }
        created++;
      }
    }

    return { created, updated, skipped: rows.filter((r) => !r.valid).length, warnings };
  });

// ─── Export products ──────────────────────────────────────────────────────────

export const exportProducts = createServerFn().handler(async () => {
  await requireAdmin();

  const allProds = await db
    .select()
    .from(products)
    .orderBy(asc(products.sku));

  const allCats = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories);
  const catById = new Map(allCats.map((c) => [c.id, c]));

  const allImgs = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .orderBy(asc(productImages.sortOrder));
  const imgsByProduct = new Map<string, string[]>();
  for (const img of allImgs) {
    const arr = imgsByProduct.get(img.productId) ?? [];
    arr.push(img.url);
    imgsByProduct.set(img.productId, arr);
  }

  const wb = XLSX.utils.book_new();

  const rows = [
    TEMPLATE_COLUMNS,
    ...allProds.map((p) => {
      const cat = p.categoryId ? catById.get(p.categoryId) : null;
      const imgs = imgsByProduct.get(p.id) ?? [];
      return [
        p.sku,
        p.name,
        cat?.slug ?? "",
        (p.price / 100).toFixed(2),
        p.mrp !== null ? (p.mrp / 100).toFixed(2) : "",
        p.stock,
        p.shortDescription ?? "",
        p.description ?? "",
        p.hsnCode ?? "",
        p.gstRate,
        p.priceIncludesGst ? "yes" : "no",
        p.isActive ? "yes" : "no",
        p.isFeatured ? "yes" : "no",
        (p.tags ?? []).join(","),
        imgs.join(","),
        p.seoTitle ?? "",
        p.seoDescription ?? "",
      ];
    }),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = TEMPLATE_COLUMNS.map((c) =>
    c === "description" || c === "image_urls" ? { wch: 40 } : { wch: 20 }
  );
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Categories sheet
  const catRows = [["slug", "name"], ...allCats.map((c) => [c.slug, c.name])];
  const catWs = XLSX.utils.aoa_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, catWs, "Categories");

  const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  return buf as string;
});

// ─── Generate error report CSV ────────────────────────────────────────────────

export const generateErrorReport = createServerFn({ method: "POST" })
  .validator(
    z.object({
      rows: z.array(
        z.object({
          rowNum: z.number(),
          sku: z.string(),
          name: z.string(),
          errors: z.array(z.string()),
          valid: z.boolean(),
        })
      ),
    })
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const errorRows = data.rows.filter((r) => !r.valid);
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Row #", "SKU", "Name", "Errors"],
      ...errorRows.map((r) => [r.rowNum, r.sku, r.name, r.errors.join("; ")]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
  });
