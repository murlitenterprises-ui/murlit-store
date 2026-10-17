import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  listAdminProducts, toggleProductActive, toggleProductFeatured,
  deleteProduct, bulkProductAction,
} from "@/fns/admin/products";
import { exportProducts } from "@/fns/admin/import-export";
import { inrFromPaise } from "@/lib/format";
import { clImg } from "@/lib/cloudinary";
import { Plus, Pencil, Trash2, Search, Star, ChevronLeft, ChevronRight, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/admin/products/")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    categoryId: typeof s.categoryId === "string" ? s.categoryId : "",
    active: (["all", "active", "inactive"] as const).includes(s.active as any) ? (s.active as any) : "all",
    stock: (["all", "in", "out"] as const).includes(s.stock as any) ? (s.stock as any) : "all",
    page: typeof s.page === "number" ? s.page : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    listAdminProducts({
      data: {
        q: deps.q || undefined,
        categoryId: deps.categoryId || undefined,
        active: deps.active,
        stock: deps.stock,
        page: deps.page,
        pageSize: 20,
      },
    }),
  component: ProductsPage,
});

function ProductsPage() {
  const router = useRouter();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const data = Route.useLoaderData();
  const { items, total, categories } = data;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const b64 = await exportProducts();
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "murlit-products-export.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Products exported");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const setSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) });

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await toggleProductActive({ data: { id, isActive: !current } });
      router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await toggleProductFeatured({ data: { id, isFeatured: !current } });
      router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? The product will be deactivated.`)) return;
    try {
      await deleteProduct({ data: { id } });
      toast.success("Product deactivated");
      router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  const handleBulk = async (action: "activate" | "deactivate" | "delete") => {
    if (!selected.size) return;
    const label = action === "delete" ? "deactivate" : action;
    if (!confirm(`${label} ${selected.size} product(s)?`)) return;
    setBulkLoading(true);
    try {
      const result = await bulkProductAction({ data: { ids: [...selected], action } });
      toast.success(`${result.count} product(s) ${label}d`);
      setSelected(new Set());
      router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} product{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            data-testid="export-products"
          >
            <Download size={14} /> {exporting ? "Exporting…" : "Export"}
          </button>
          <Link
            to="/admin/products/import"
            className="flex items-center gap-1.5 rounded border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            data-testid="import-from-excel"
          >
            <Upload size={14} /> Import from Excel
          </Link>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-1.5 rounded bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={15} /> New Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded border border-gray-200 px-2.5 py-1.5 flex-1 min-w-40">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search.q}
            onChange={(e) => setSearch({ q: e.target.value })}
            placeholder="Search name or SKU…"
            className="text-sm outline-none w-full"
          />
        </div>
        <select
          value={search.categoryId}
          onChange={(e) => setSearch({ categoryId: e.target.value })}
          className="rounded border border-gray-200 px-2.5 py-1.5 text-sm outline-none bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={search.active}
          onChange={(e) => setSearch({ active: e.target.value as any })}
          className="rounded border border-gray-200 px-2.5 py-1.5 text-sm outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={search.stock}
          onChange={(e) => setSearch({ stock: e.target.value as any })}
          className="rounded border border-gray-200 px-2.5 py-1.5 text-sm outline-none bg-white"
        >
          <option value="all">All Stock</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm">
          <span className="text-amber-800 font-medium">{selected.size} selected</span>
          <button
            onClick={() => handleBulk("activate")}
            disabled={bulkLoading}
            className="rounded bg-green-600 px-3 py-1 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >Activate</button>
          <button
            onClick={() => handleBulk("deactivate")}
            disabled={bulkLoading}
            className="rounded bg-gray-600 px-3 py-1 text-white text-xs font-medium hover:bg-gray-700 disabled:opacity-50"
          >Deactivate</button>
          <button
            onClick={() => handleBulk("delete")}
            disabled={bulkLoading}
            className="rounded bg-red-600 px-3 py-1 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
          >Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Product</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 hidden lg:table-cell">Category</th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">Price</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-600">Stock</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-600">Active</th>
              <th className="text-center px-3 py-2.5 font-medium text-gray-600">Featured</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? "bg-amber-50" : "hover:bg-gray-50/50"}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={clImg(p.imageUrl, 80, 80) ?? p.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 leading-tight">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-500 hidden lg:table-cell">{p.categoryName ?? "—"}</td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                  {inrFromPaise(p.price)}
                  {p.mrp && p.mrp > p.price && (
                    <div className="text-xs text-gray-400 line-through">{inrFromPaise(p.mrp)}</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.stock === 0 ? "bg-red-100 text-red-700" :
                    p.stock < 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => handleToggleActive(p.id, p.isActive)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${p.isActive ? "bg-green-500" : "bg-gray-200"}`}
                    title={p.isActive ? "Click to deactivate" : "Click to activate"}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${p.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => handleToggleFeatured(p.id, p.isFeatured)}
                    title={p.isFeatured ? "Featured – click to unfeature" : "Click to feature"}
                  >
                    <Star
                      size={16}
                      className={p.isFeatured ? "fill-[var(--gold)] text-[var(--gold)]" : "text-gray-300"}
                    />
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <Link
                      to="/admin/products/$id/edit"
                      params={{ id: p.id }}
                      className="p-1 text-gray-400 hover:text-[var(--maroon)]"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {search.page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => navigate({ search: (s) => ({ ...s, page: s.page - 1 }) })}
              disabled={search.page <= 1}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigate({ search: (s) => ({ ...s, page: s.page + 1 }) })}
              disabled={search.page >= totalPages}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
