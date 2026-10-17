import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { createProduct, updateProduct, getAdminCategories } from "@/fns/admin/products";
import { getCloudinarySignature, deleteCloudinaryImage } from "@/fns/admin/upload";
import { clImg } from "@/lib/cloudinary";
import { discountPct } from "@/lib/format";
import { Loader2, Upload, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  priceRs: z.number().positive("Must be > 0"),
  mrpRs: z.number().min(0).optional(),
  sku: z.string().min(1, "Required"),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  badge: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  subCategoryId: z.string().uuid().nullable().optional(),
  tagsStr: z.string().optional(),
  occasionsStr: z.string().optional(),
  materials: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.coerce.number().refine((v) => [0, 5, 12, 18].includes(v)).default(5),
  priceIncludesGst: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type ImageEntry = {
  id?: string;
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
  uploading?: boolean;
  uploadError?: string;
};

type CatNode = { id: string; name: string; parentId: string | null; slug: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────

function ImageUploader({
  images, onChange,
}: {
  images: ImageEntry[];
  onChange: (imgs: ImageEntry[]) => void;
}) {
  const uploadFile = useCallback(
    async (file: File) => {
      // Use a stable object reference so we can find this entry after async ops
      const placeholder: ImageEntry = {
        url: URL.createObjectURL(file),
        alt: "",
        sortOrder: 0,
        uploading: true,
      };
      // Use functional updater to avoid stale closure on `images`
      onChange((prev: any) => {
        const next = [...prev, { ...placeholder, sortOrder: prev.length }];
        return next;
      });

      try {
        const sig = await getCloudinarySignature({ data: { folder: "murlit-products" } });
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("folder", sig.folder);
        fd.append("signature", sig.signature);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: fd }
        );
        const json = await res.json() as { secure_url?: string; public_id?: string; error?: { message: string } };

        URL.revokeObjectURL(placeholder.url);

        if (!res.ok || json.error || !json.secure_url) {
          const errMsg = json.error?.message ?? `Upload failed (HTTP ${res.status})`;
          onChange((prev: any) =>
            prev.map((img: ImageEntry) =>
              img.url === placeholder.url
                ? { ...img, uploading: false, uploadError: errMsg }
                : img
            )
          );
          toast.error(`Upload failed: ${errMsg}`);
          return;
        }

        onChange((prev: any) =>
          prev.map((img: ImageEntry) =>
            img.url === placeholder.url
              ? { url: json.secure_url!, publicId: json.public_id, alt: "", sortOrder: img.sortOrder, uploading: false }
              : img
          )
        );
        toast.success("Image uploaded");
      } catch (e: any) {
        URL.revokeObjectURL(placeholder.url);
        onChange((prev: any) =>
          prev.map((img: ImageEntry) =>
            img.url === placeholder.url
              ? { ...img, uploading: false, uploadError: e?.message ?? "Upload failed" }
              : img
          )
        );
        toast.error("Image upload failed");
      }
    },
    [onChange]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).slice(0, 10 - images.length);
    for (const f of allowed) {
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} exceeds 8 MB`); continue; }
      uploadFile(f);
    }
  };

  const remove = async (idx: number) => {
    const img = images[idx];
    if (img.publicId) {
      try { await deleteCloudinaryImage({ data: { publicId: img.publicId } }); }
      catch { /* best-effort */ }
    }
    onChange(images.filter((_, i) => i !== idx).map((im, i) => ({ ...im, sortOrder: i })));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onChange(next.map((im, i) => ({ ...im, sortOrder: i })));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative group rounded-lg border border-gray-200 overflow-hidden aspect-square bg-gray-50">
            <img
              src={clImg(img.url, 240, 240) ?? img.url}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
            {img.uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
            {img.uploadError && (
              <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-1.5 gap-1">
                <p className="text-white text-[9px] text-center leading-tight">{img.uploadError}</p>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, i) => i !== idx))}
                  className="text-white/80 text-[9px] underline"
                >Remove</button>
              </div>
            )}
            {!img.uploading && !img.uploadError && (
              <>
                {idx === 0 && (
                  <div className="absolute top-1 left-1 bg-[var(--gold)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    MAIN
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    className="p-1 bg-white rounded shadow text-gray-700 hover:bg-gray-50"
                    title="Move left (main image)"
                  ><ArrowUp size={11} /></button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    className="p-1 bg-white rounded shadow text-gray-700 hover:bg-gray-50"
                    title="Move right"
                  ><ArrowDown size={11} /></button>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1 bg-white rounded shadow text-red-600 hover:bg-red-50"
                    title="Remove"
                  ><Trash2 size={11} /></button>
                </div>
                {/* Alt text */}
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => {
                    const next = [...images];
                    next[idx] = { ...img, alt: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Alt text…"
                  className="absolute bottom-0 left-0 right-0 text-[10px] px-1.5 py-1 bg-black/60 text-white outline-none opacity-0 group-hover:opacity-100 placeholder:text-white/50 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            )}
          </div>
        ))}

        {images.length < 10 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors">
            <Upload size={20} />
            <span className="text-xs mt-1">Add image</span>
            <span className="text-[10px] text-gray-300">{images.length}/10</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-400">First image = main. Max 10 images, 8 MB each. JPG/PNG/WEBP.</p>
    </div>
  );
}

// ─── Main form component ───────────────────────────────────────────────────────

export function ProductForm({
  product,
  allCategories,
}: {
  product?: Awaited<ReturnType<typeof import("@/fns/admin/products").getAdminProduct>>;
  allCategories: CatNode[];
}) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageEntry[]>(
    product?.images.map((img) => ({
      id: img.id,
      url: img.url,
      publicId: img.publicId ?? undefined,
      alt: img.alt ?? "",
      sortOrder: img.sortOrder,
    })) ?? []
  );

  const topCats = allCategories.filter((c) => !c.parentId);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      shortDescription: product?.shortDescription ?? "",
      description: product?.description ?? "",
      priceRs: product ? product.price / 100 : 0,
      mrpRs: product?.mrp ? product.mrp / 100 : undefined,
      sku: product?.sku ?? "",
      stock: product?.stock ?? 0,
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      badge: product?.badge ?? "",
      categoryId: product?.categoryId
        ? (allCategories.find((c) => c.id === product.categoryId)?.parentId ? allCategories.find((c) => c.id === product.categoryId)?.parentId : product.categoryId) ?? null
        : null,
      subCategoryId: product?.categoryId
        ? (allCategories.find((c) => c.id === product.categoryId)?.parentId ? product.categoryId : null)
        : null,
      tagsStr: product?.tags.join(", ") ?? "",
      occasionsStr: product?.occasions.join(", ") ?? "",
      materials: product?.materials ?? "",
      weight: product?.weight ?? "",
      dimensions: product?.dimensions ?? "",
      hsnCode: product?.hsnCode ?? "",
      gstRate: product?.gstRate ?? 5,
      priceIncludesGst: product?.priceIncludesGst ?? true,
      seoTitle: product?.seoTitle ?? "",
      seoDescription: product?.seoDescription ?? "",
    },
  });

  const watchName = watch("name");
  const watchPriceRs = watch("priceRs");
  const watchMrpRs = watch("mrpRs");
  const watchCatId = watch("categoryId");
  const watchSeoTitle = watch("seoTitle");
  const watchSeoDesc = watch("seoDescription");

  // Auto-slug from name (only when creating)
  useEffect(() => {
    if (!product && watchName) {
      setValue("slug", slugify(watchName));
    }
  }, [watchName, product, setValue]);

  const subCats = allCategories.filter((c) => c.parentId === watchCatId);

  const discPct =
    watchPriceRs && watchMrpRs && watchMrpRs > watchPriceRs
      ? discountPct(watchPriceRs * 100, watchMrpRs * 100)
      : null;

  const hasUploadingImages = images.some((img) => img.uploading);
  const hasFailedImages = images.some((img) => img.uploadError);

  const onSubmit = async (data: FormData) => {
    if (hasUploadingImages) {
      toast.error("Please wait for images to finish uploading");
      return;
    }
    if (hasFailedImages) {
      toast.error("Remove failed images before saving");
      return;
    }
    // Extra guard: never send images without a real URL
    const readyImages = images.filter((img) => img.url.startsWith("http"));
    if (readyImages.length !== images.length) {
      toast.error("Some images are missing a URL — please re-upload them");
      return;
    }
    setSaving(true);
    try {
      const effectiveCategoryId = data.subCategoryId || data.categoryId || null;
      const payload = {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        price: Math.round(data.priceRs * 100),
        mrp: data.mrpRs ? Math.round(data.mrpRs * 100) : undefined,
        sku: data.sku,
        stock: data.stock,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        badge: data.badge || null,
        categoryId: effectiveCategoryId,
        tags: data.tagsStr ? data.tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [],
        occasions: data.occasionsStr ? data.occasionsStr.split(",").map((t) => t.trim()).filter(Boolean) : [],
        materials: data.materials || undefined,
        weight: data.weight || undefined,
        dimensions: data.dimensions || undefined,
        hsnCode: data.hsnCode || undefined,
        gstRate: data.gstRate,
        priceIncludesGst: data.priceIncludesGst,
        seoTitle: data.seoTitle || undefined,
        seoDescription: data.seoDescription || undefined,
        images: readyImages.map((img, i) => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
          alt: img.alt || undefined,
          sortOrder: i,
        })),
      };

      if (product) {
        await updateProduct({ data: { id: product.id, data: payload } });
        toast.success("Product updated");
      } else {
        await createProduct({ data: payload });
        toast.success("Product created");
        navigate({ to: "/admin/products" });
        return;
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--maroon)] focus:ring-1 focus:ring-[var(--maroon)]";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Images */}
      <Section title="Images">
        <ImageUploader images={images} onChange={setImages} />
      </Section>

      {/* Basic */}
      <Section title="Basic Information">
        <Field label="Product Name" required error={errors.name?.message}>
          <input {...register("name")} className={inp} placeholder="e.g. Brass Diya Set" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Slug" required error={errors.slug?.message} hint="URL-friendly name">
            <input {...register("slug")} className={inp} />
          </Field>
          <Field label="Badge">
            <select {...register("badge")} className={inp}>
              <option value="">None</option>
              <option value="Best Seller">Best Seller</option>
              <option value="New Arrival">New Arrival</option>
              <option value="Handcrafted">Handcrafted</option>
              <option value="Limited">Limited</option>
            </select>
          </Field>
        </div>
        <Field label="Short Description">
          <input {...register("shortDescription")} className={inp} placeholder="One-line summary" />
        </Field>
        <Field label="Description">
          <textarea {...register("description")} rows={5} className={inp} placeholder="Full product description…" />
        </Field>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Selling Price (₹)" required error={errors.priceRs?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("priceRs", { valueAsNumber: true })}
              className={inp}
              placeholder="299.00"
            />
          </Field>
          <Field label="MRP (₹)" hint="Optional – leave blank if no discount">
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("mrpRs", { valueAsNumber: true })}
              className={inp}
              placeholder="399.00"
            />
          </Field>
        </div>
        {discPct !== null && (
          <p className="text-sm text-green-700 font-medium">{discPct}% off</p>
        )}
      </Section>

      {/* Inventory */}
      <Section title="Inventory">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SKU" required error={errors.sku?.message}>
            <input {...register("sku")} className={inp} placeholder="MRL-001" />
          </Field>
          <Field label="Stock Quantity" error={errors.stock?.message}>
            <input type="number" min="0" {...register("stock", { valueAsNumber: true })} className={inp} />
          </Field>
        </div>
      </Section>

      {/* Category */}
      <Section title="Category">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category">
            <select
              {...register("categoryId")}
              onChange={(e) => {
                setValue("categoryId", e.target.value || null);
                setValue("subCategoryId", null);
              }}
              className={inp}
            >
              <option value="">— None —</option>
              {topCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          {subCats.length > 0 && (
            <Field label="Sub-Category">
              <select {...register("subCategoryId")} className={inp}>
                <option value="">— None —</option>
                {subCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </Section>

      {/* Status */}
      <Section title="Status & Visibility">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register("isActive")} className="rounded w-4 h-4" />
            Active (visible in store)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register("isFeatured")} className="rounded w-4 h-4" />
            Featured (shown on home page)
          </label>
        </div>
      </Section>

      {/* Tags & Occasions */}
      <Section title="Tags & Occasions">
        <Field label="Tags" hint="Comma-separated: wedding, pooja, gift">
          <input {...register("tagsStr")} className={inp} placeholder="wedding, pooja, handcrafted" />
        </Field>
        <Field label="Occasions" hint="Comma-separated">
          <input {...register("occasionsStr")} className={inp} placeholder="Diwali, Wedding, Haldi" />
        </Field>
      </Section>

      {/* Attributes */}
      <Section title="Attributes">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Materials">
            <input {...register("materials")} className={inp} placeholder="Brass, Cotton" />
          </Field>
          <Field label="Weight">
            <input {...register("weight")} className={inp} placeholder="500g" />
          </Field>
          <Field label="Dimensions">
            <input {...register("dimensions")} className={inp} placeholder="10×5×3 cm" />
          </Field>
        </div>
      </Section>

      {/* GST */}
      <Section title="GST & Tax">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="HSN Code">
            <input {...register("hsnCode")} className={inp} placeholder="4421" />
          </Field>
          <Field label="GST Rate">
            <select {...register("gstRate", { valueAsNumber: true })} className={inp}>
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
            </select>
          </Field>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register("priceIncludesGst")} className="rounded w-4 h-4" />
              Price includes GST
            </label>
          </div>
        </div>
      </Section>

      {/* SEO */}
      <Section title="SEO">
        <Field
          label="SEO Title"
          hint={`${(watchSeoTitle ?? "").length}/60 characters`}
        >
          <input
            {...register("seoTitle")}
            maxLength={60}
            className={inp}
            placeholder="Title for search engines"
          />
        </Field>
        <Field
          label="SEO Description"
          hint={`${(watchSeoDesc ?? "").length}/160 characters`}
        >
          <textarea
            {...register("seoDescription")}
            maxLength={160}
            rows={3}
            className={inp}
            placeholder="Meta description for search engines"
          />
        </Field>
      </Section>

      {/* Submit */}
      {hasUploadingImages && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Waiting for images to upload…
        </p>
      )}
      {hasFailedImages && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          Some images failed to upload. Remove them before saving.
        </p>
      )}
      <div className="flex gap-3 pb-8">
        <button
          type="submit"
          disabled={saving || hasUploadingImages || hasFailedImages}
          className="rounded bg-[var(--maroon)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : product ? "Update Product" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/products" })}
          className="rounded border border-gray-200 px-6 py-2.5 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
