import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  listAdminCategories, createCategory, updateCategory,
  deleteCategory, reorderCategory,
} from "@/fns/admin/categories";
import { getCloudinarySignature } from "@/fns/admin/upload";
import { clImg } from "@/lib/cloudinary";
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Image, X, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  loader: () => listAdminCategories(),
  component: CategoriesPage,
});

type CatRow = Awaited<ReturnType<typeof listAdminCategories>>[number];
type SubRow = CatRow["children"][number];

const schema = z.object({
  name: z.string().min(1, "Required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "a-z, 0-9, hyphens only"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  parentId: z.string().uuid().nullable().optional(),
  image: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function CategoryForm({
  initial, topCategories, onSave, onCancel,
}: {
  initial?: Partial<FormData & { id: string }>;
  topCategories: { id: string; name: string }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      sortOrder: initial?.sortOrder ?? 0,
      isActive: initial?.isActive ?? true,
      parentId: initial?.parentId ?? null,
      image: initial?.image ?? "",
    },
  });

  const imageVal = watch("image");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sig = await getCloudinarySignature({ data: { folder: "murlit-categories" } });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("folder", sig.folder);
      fd.append("signature", sig.signature);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST", body: fd,
      });
      const json = await res.json() as { secure_url: string };
      setValue("image", json.secure_url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (initial?.id) {
        await updateCategory({ data: { id: initial.id, data: { ...data, parentId: data.parentId ?? null } } });
        toast.success("Category updated");
      } else {
        await createCategory({ data: { ...data, parentId: data.parentId ?? null } });
        toast.success("Category created");
      }
      onSave();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{initial?.id ? "Edit Category" : "New Category"}</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input {...register("name")} className="inp" />
          {errors.name && <p className="err">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug <span className="text-red-500">*</span></label>
          <input {...register("slug")} className="inp" />
          {errors.slug && <p className="err">{errors.slug.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
        <select {...register("parentId")} className="inp">
          <option value="">— Top Level —</option>
          {topCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea {...register("description")} rows={2} className="inp" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input type="number" {...register("sortOrder", { valueAsNumber: true })} className="inp" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" id="catActive" {...register("isActive")} className="rounded" />
          <label htmlFor="catActive" className="text-sm text-gray-700">Active</label>
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
        {imageVal ? (
          <div className="flex items-center gap-3">
            <img src={clImg(imageVal, 80, 80) ?? imageVal} alt="" className="w-16 h-16 rounded object-cover border" />
            <button type="button" onClick={() => setValue("image", "")} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        ) : (
          <label className={`flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 ${uploading ? "opacity-50" : ""}`}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
            {uploading ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="rounded bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CategoriesPage() {
  const router = useRouter();
  const tree = Route.useLoaderData();
  const [editing, setEditing] = useState<null | { id?: string; data?: any; parentId?: string | null }>(null);

  const reload = () => {
    setEditing(null);
    router.invalidate();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory({ data: { id } });
      toast.success("Category deleted");
      router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    try {
      await reorderCategory({ data: { id, direction } });
      router.invalidate();
    } catch { /* ignore */ }
  };

  const topCategories = tree.map((c) => ({ id: c.id, name: c.name }));

  const RowActions = ({ item, parentId }: { item: any; parentId?: string | null }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleReorder(item.id, "up")}
        className="p-1 text-gray-400 hover:text-gray-600"
        title="Move up"
      ><ChevronUp size={14} /></button>
      <button
        onClick={() => handleReorder(item.id, "down")}
        className="p-1 text-gray-400 hover:text-gray-600"
        title="Move down"
      ><ChevronDown size={14} /></button>
      <button
        onClick={() => setEditing({ id: item.id, data: item, parentId: item.parentId ?? null })}
        className="p-1 text-gray-400 hover:text-[var(--maroon)]"
        title="Edit"
      ><Pencil size={14} /></button>
      <button
        onClick={() => handleDelete(item.id, item.name)}
        className="p-1 text-gray-400 hover:text-red-600"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tree.length} top-level categories</p>
        </div>
        <button
          onClick={() => setEditing({ parentId: null })}
          className="flex items-center gap-1.5 rounded bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={15} /> New Category
        </button>
      </div>

      {editing && (
        <CategoryForm
          initial={editing.id ? { id: editing.id, ...editing.data } : { parentId: editing.parentId }}
          topCategories={topCategories}
          onSave={reload}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-2.5 font-medium text-gray-600 hidden md:table-cell">Products</th>
              <th className="text-center px-4 py-2.5 font-medium text-gray-600 hidden md:table-cell">Active</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tree.map((cat) => (
              <>
                <tr key={cat.id} className="bg-gray-50/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {cat.image && (
                        <img src={clImg(cat.image, 32, 32) ?? cat.image} alt="" className="w-7 h-7 rounded object-cover" />
                      )}
                      <span className="font-medium text-gray-800">{cat.name}</span>
                      <button
                        onClick={() => setEditing({ parentId: cat.id })}
                        className="ml-1 text-xs text-[var(--maroon)] hover:underline"
                        title="Add sub-category"
                      >+ sub</button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{cat.slug}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500 hidden md:table-cell">{cat.productCount}</td>
                  <td className="px-4 py-2.5 text-center hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <RowActions item={cat} />
                  </td>
                </tr>
                {cat.children.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-4 py-2.5 pl-10">
                      <div className="flex items-center gap-2 text-gray-600">
                        {sub.image && (
                          <img src={clImg(sub.image, 28, 28) ?? sub.image} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <span>↳ {sub.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{sub.slug}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500 hidden md:table-cell">{sub.productCount}</td>
                    <td className="px-4 py-2.5 text-center hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sub.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {sub.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <RowActions item={sub} parentId={cat.id} />
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {tree.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No categories yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
