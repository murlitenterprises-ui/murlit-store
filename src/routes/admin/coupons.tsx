import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { listCoupons, createCoupon, updateCoupon, deactivateCoupon } from "@/fns/admin/coupons";
import { inrFromPaise } from "@/lib/format";
import { Plus, Edit2, ToggleLeft, Search } from "lucide-react";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

const couponSchema = z.object({
  code: z.string().min(2).max(30),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive(),
  minOrderRs: z.number().min(0).default(0),
  maxDiscountRs: z.number().positive().optional().nullable(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().nullable(),
  firstOrderOnly: z.boolean().default(false),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
});
type FormData = z.infer<typeof couponSchema>;

function AdminCoupons() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listCoupons>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const d = await listCoupons({ data: { page: p, search: q || undefined } });
      setResult(d);
      setPage(p);
    } finally { setLoading(false); }
  };

  useState(() => { load(1); });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: "percent", isActive: true, firstOrderOnly: false },
  });

  const typeVal = watch("type");

  const openCreate = () => { setEditId(null); reset({ type: "percent", isActive: true, firstOrderOnly: false, isPublic: false, value: undefined as any }); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditId(c.id);
    reset({
      code: c.code,
      type: c.type,
      value: c.type === "flat" ? c.value / 100 : c.value,
      minOrderRs: c.minOrder / 100,
      maxDiscountRs: c.maxDiscount ? c.maxDiscount / 100 : null,
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 16) : "",
      endsAt: c.endsAt ? new Date(c.endsAt).toISOString().slice(0, 16) : "",
      usageLimit: c.usageLimit ?? null,
      perUserLimit: c.perUserLimit ?? null,
      firstOrderOnly: c.firstOrderOnly,
      description: c.description ?? "",
      isActive: c.isActive,
      isPublic: (c as any).isPublic ?? false,
    });
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        code: data.code.toUpperCase().trim(),
        type: data.type,
        value: data.type === "flat" ? Math.round(data.value * 100) : Math.round(data.value),
        minOrder: Math.round((data.minOrderRs ?? 0) * 100),
        maxDiscount: data.type === "percent" && data.maxDiscountRs ? Math.round(data.maxDiscountRs * 100) : null,
        startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit ?? null,
        firstOrderOnly: data.firstOrderOnly,
        description: data.description || null,
        isActive: data.isActive,
        isPublic: data.isPublic,
      };
      if (editId) {
        await updateCoupon({ data: { ...payload, id: editId } });
        toast.success("Coupon updated");
      } else {
        await createCoupon({ data: payload });
        toast.success("Coupon created");
      }
      setShowForm(false);
      load(1);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save coupon");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this coupon?")) return;
    try {
      await deactivateCoupon({ data: { id } });
      toast.success("Coupon deactivated");
      load(page);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const inp = "w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--maroon)] focus:ring-1 focus:ring-[var(--maroon)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage discount coupons</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); load(1, search); }} className="flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or description…" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--maroon)]" />
        <button type="submit" className="flex items-center gap-1.5 rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"><Search size={14} />Search</button>
      </form>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-lg mb-4">{editId ? "Edit Coupon" : "New Coupon"}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input {...register("code")} placeholder="SAVE20" className={inp} style={{ textTransform: "uppercase" }} />
              {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select {...register("type")} className={inp}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value * {typeVal === "percent" ? "(% off)" : "(₹ off)"}</label>
              <input type="number" step={typeVal === "percent" ? "1" : "0.01"} {...register("value", { valueAsNumber: true })} className={inp} placeholder={typeVal === "percent" ? "10" : "50"} />
              {errors.value && <p className="text-xs text-red-600">{errors.value.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Order (₹)</label>
              <input type="number" step="0.01" {...register("minOrderRs", { valueAsNumber: true })} className={inp} placeholder="0" />
            </div>
            {typeVal === "percent" && (
              <div>
                <label className="block text-sm font-medium mb-1">Max Discount Cap (₹)</label>
                <input type="number" step="0.01" {...register("maxDiscountRs", { valueAsNumber: true })} className={inp} placeholder="e.g. 500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Total Usage Limit</label>
              <input type="number" {...register("usageLimit", { valueAsNumber: true })} className={inp} placeholder="Unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Per User Limit</label>
              <input type="number" {...register("perUserLimit", { valueAsNumber: true })} className={inp} placeholder="Unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valid From</label>
              <input type="datetime-local" {...register("startsAt")} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valid Until</label>
              <input type="datetime-local" {...register("endsAt")} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (shown to customers)</label>
              <input {...register("description")} className={inp} placeholder="Get 10% off on orders above ₹500" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register("firstOrderOnly")} className="rounded" />
                First order only
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register("isPublic")} className="rounded" />
                Show in Available Offers
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="rounded" />
                Active
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={isSubmitting} className="rounded bg-[var(--maroon)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {isSubmitting ? "Saving…" : editId ? "Update" : "Create Coupon"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded border px-5 py-2 text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Code", "Type", "Value", "Min Order", "Used", "Valid Until", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && !result?.rows.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No coupons yet</td></tr>}
            {result?.rows.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-[var(--maroon)]">{c.code}</td>
                <td className="px-4 py-3 capitalize">{c.type}</td>
                <td className="px-4 py-3">
                  {c.type === "percent" ? `${c.value}%` : inrFromPaise(c.value)}
                  {c.maxDiscount ? ` (max ${inrFromPaise(c.maxDiscount)})` : ""}
                </td>
                <td className="px-4 py-3">{c.minOrder ? inrFromPaise(c.minOrder) : "—"}</td>
                <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.endsAt ? new Date(c.endsAt).toLocaleDateString("en-IN") : "No expiry"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-[var(--maroon)]" title="Edit"><Edit2 size={14} /></button>
                    {c.isActive && <button onClick={() => handleDeactivate(c.id)} className="text-gray-400 hover:text-red-600" title="Deactivate"><ToggleLeft size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result && result.total > result.pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>{result.total} coupons</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page * result.pageSize >= result.total} onClick={() => load(page + 1)} className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
