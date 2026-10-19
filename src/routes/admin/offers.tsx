import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { listOffersAdmin, updateOfferAdmin, toggleOfferAdmin } from "@/fns/admin/offers";
import { inrFromPaise } from "@/lib/format";
import { Edit2, ToggleLeft, ToggleRight } from "lucide-react";

export const Route = createFileRoute("/admin/offers")({
  component: AdminOffers,
});

const offerEditSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  tagText: z.string().optional().nullable(),
  percent: z.number().int().min(0).max(20),
  maxDiscountRs: z.number().positive().optional().nullable(),
  minOrderRs: z.number().min(0).default(0),
  minPastOrders: z.number().int().min(0).default(0),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().default(0),
});
type FormData = z.infer<typeof offerEditSchema>;

type Offer = Awaited<ReturnType<typeof listOffersAdmin>>[number];

const TYPE_LABELS: Record<string, string> = {
  welcome: "Welcome",
  loyalty: "Loyalty",
  cart_value: "Cart Value",
  sitewide: "Sitewide",
  bank: "Bank",
};

function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);

  const load = async () => {
    setLoading(true);
    try { setOffers(await listOffersAdmin()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(offerEditSchema) as any,
  });

  const openEdit = (o: Offer) => {
    setEditOffer(o);
    reset({
      title: o.title,
      description: o.description ?? "",
      tagText: o.tagText ?? "",
      percent: o.percent,
      maxDiscountRs: o.maxDiscountPaise ? o.maxDiscountPaise / 100 : null,
      minOrderRs: o.minOrderPaise / 100,
      minPastOrders: o.minPastOrders,
      startsAt: o.startsAt ? new Date(o.startsAt).toISOString().slice(0, 16) : "",
      endsAt: o.endsAt ? new Date(o.endsAt).toISOString().slice(0, 16) : "",
      isActive: o.isActive,
      sortOrder: o.sortOrder,
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!editOffer) return;
    try {
      await updateOfferAdmin({
        data: {
          id: editOffer.id,
          title: data.title,
          description: data.description ?? null,
          tagText: data.tagText ?? null,
          percent: data.percent,
          maxDiscountPaise: data.maxDiscountRs ? Math.round(data.maxDiscountRs * 100) : null,
          minOrderPaise: Math.round((data.minOrderRs ?? 0) * 100),
          minPastOrders: data.minPastOrders,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
      });
      toast.success("Offer updated");
      setEditOffer(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save offer");
    }
  };

  const handleToggle = async (o: Offer) => {
    try {
      await toggleOfferAdmin({ data: { id: o.id, isActive: !o.isActive } });
      toast.success(o.isActive ? "Offer disabled" : "Offer enabled");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const inp = "w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--maroon)] focus:ring-1 focus:ring-[var(--maroon)]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auto Offers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage automatic offers applied at checkout. Only one offer applies per order (best one wins).</p>
      </div>

      {editOffer && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-lg mb-1">Edit: {editOffer.title}</h2>
          <p className="text-xs text-gray-400 mb-4">Type: <span className="font-medium text-gray-600">{TYPE_LABELS[editOffer.type] ?? editOffer.type}</span> · Key: <code className="font-mono">{editOffer.key}</code></p>
          <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input {...register("title")} className={inp} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tag Text (badge)</label>
              <input {...register("tagText")} className={inp} placeholder="e.g. NEW USER" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount % (max 20)</label>
              <input type="number" {...register("percent", { valueAsNumber: true })} className={inp} min={0} max={20} />
              {errors.percent && <p className="text-xs text-red-600">{errors.percent.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Discount Cap (₹)</label>
              <input type="number" step="0.01" {...register("maxDiscountRs", { valueAsNumber: true })} className={inp} placeholder="No cap" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Order Value (₹)</label>
              <input type="number" step="0.01" {...register("minOrderRs", { valueAsNumber: true })} className={inp} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Past Orders (loyalty)</label>
              <input type="number" {...register("minPastOrders", { valueAsNumber: true })} className={inp} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valid From</label>
              <input type="datetime-local" {...register("startsAt")} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valid Until</label>
              <input type="datetime-local" {...register("endsAt")} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <input type="number" {...register("sortOrder", { valueAsNumber: true })} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (shown to customers)</label>
              <input {...register("description")} className={inp} placeholder="Short offer description" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="rounded" />
                Active
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={isSubmitting} className="rounded bg-[var(--maroon)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {isSubmitting ? "Saving…" : "Update Offer"}
              </button>
              <button type="button" onClick={() => setEditOffer(null)} className="rounded border px-5 py-2 text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Offer", "Type", "Discount", "Min Order", "Conditions", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && !offers.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No offers</td></tr>}
            {offers.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{o.title}</div>
                  {o.tagText && <span className="mt-0.5 inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">{o.tagText}</span>}
                </td>
                <td className="px-4 py-3 capitalize text-gray-500">{TYPE_LABELS[o.type] ?? o.type}</td>
                <td className="px-4 py-3 font-semibold text-green-700">
                  {o.percent}%
                  {o.maxDiscountPaise ? <span className="text-gray-400 font-normal ml-1">(max {inrFromPaise(o.maxDiscountPaise)})</span> : ""}
                </td>
                <td className="px-4 py-3">{o.minOrderPaise ? inrFromPaise(o.minOrderPaise) : "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {o.type === "loyalty" && `${o.minPastOrders}+ orders`}
                  {o.type === "welcome" && "First order"}
                  {o.type === "cart_value" && `Min ${inrFromPaise(o.minOrderPaise)}`}
                  {o.type === "sitewide" && "All orders"}
                  {o.type === "bank" && "Coming soon"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {o.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(o)} className="text-gray-400 hover:text-[var(--maroon)]" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => handleToggle(o)} className={`${o.isActive ? "text-gray-400 hover:text-red-500" : "text-gray-400 hover:text-green-600"}`} title={o.isActive ? "Disable" : "Enable"}>
                      {o.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
