import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { getStoreSettings, saveStoreSettings } from "@/fns/admin/settings";
import { INDIAN_STATES } from "@/lib/india-states";
import { inrFromPaise } from "@/lib/format";

export const Route = createFileRoute("/admin/settings")({
  loader: () => getStoreSettings(),
  component: SettingsPage,
});

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const schema = z.object({
  legalName: z.string().min(1, "Required"),
  gstin: z.string().regex(GSTIN_RE, "Invalid GSTIN format").optional().or(z.literal("")),
  registeredAddress: z.string().optional(),
  state: z.string().min(1, "Required"),
  stateCode: z.string().min(1, "Required"),
  invoicePrefix: z.string().min(1).max(10),
  pricesIncludeGst: z.boolean(),
  freeShippingAboveRs: z.number().min(0),
  shippingFeeRs: z.number().min(0),
  whatsappNumber: z.string().optional(),
  supportEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

function SettingsPage() {
  const settings = Route.useLoaderData();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalName: settings?.legalName ?? "",
      gstin: settings?.gstin ?? "",
      registeredAddress: settings?.registeredAddress ?? "",
      state: settings?.state ?? "",
      stateCode: settings?.stateCode ?? "",
      invoicePrefix: settings?.invoicePrefix ?? "MUR",
      pricesIncludeGst: settings?.pricesIncludeGst ?? true,
      freeShippingAboveRs: (settings?.freeShippingAbove ?? 50000) / 100,
      shippingFeeRs: (settings?.shippingFee ?? 9900) / 100,
      whatsappNumber: settings?.whatsappNumber ?? "",
      supportEmail: settings?.supportEmail ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await saveStoreSettings({
        data: {
          ...data,
          gstin: data.gstin || undefined,
          freeShippingAbove: Math.round(data.freeShippingAboveRs * 100),
          shippingFee: Math.round(data.shippingFeeRs * 100),
          whatsappNumber: data.whatsappNumber || undefined,
          supportEmail: data.supportEmail || undefined,
        },
      });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const F = ({
    label, name, type = "text", placeholder, hint, required,
  }: {
    label: string; name: keyof FormData; type?: string;
    placeholder?: string; hint?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        {...register(name, { valueAsNumber: type === "number" })}
        placeholder={placeholder}
        className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--maroon)] focus:ring-1 focus:ring-[var(--maroon)]"
      />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      {errors[name] && <p className="text-xs text-red-600 mt-0.5">{(errors[name] as any)?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">GST invoicing and store configuration</p>
      </div>

      {/* Legal */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Legal Details</h2>
        <F label="Legal Name" name="legalName" required placeholder="Murlit Enterprises" />
        <F label="GSTIN" name="gstin" placeholder="22AAAAA0000A1Z5" hint="15-char GST number" />
        <F label="Registered Address" name="registeredAddress" placeholder="Full address for invoices" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <select
              {...register("state")}
              onChange={(e) => {
                const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                setValue("state", e.target.value);
                if (st) setValue("stateCode", st.code);
              }}
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--maroon)]"
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
            {errors.state && <p className="text-xs text-red-600 mt-0.5">{errors.state.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
            <input
              {...register("stateCode")}
              readOnly
              className="w-full rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Invoice */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Invoicing</h2>
        <F label="Invoice Prefix" name="invoicePrefix" placeholder="MUR" hint="e.g. MUR → MUR/2026-27/0001" />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("pricesIncludeGst")} className="rounded" />
          Product prices include GST
        </label>
      </section>

      {/* Shipping */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Shipping</h2>
        <F label="Free Shipping Above (₹)" name="freeShippingAboveRs" type="number" placeholder="500" />
        <F label="Shipping Fee (₹)" name="shippingFeeRs" type="number" placeholder="99" />
      </section>

      {/* Contact */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Contact</h2>
        <F label="WhatsApp Number" name="whatsappNumber" placeholder="+919876543210" />
        <F label="Support Email" name="supportEmail" type="email" placeholder="support@murlit.com" />
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-[var(--maroon)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
