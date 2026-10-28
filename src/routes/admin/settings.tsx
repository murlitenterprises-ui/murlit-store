import { createFileRoute } from "@tanstack/react-router";
import { useForm, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { getStoreSettings, saveStoreSettings } from "@/fns/admin/settings";
import { getExchangeRatesAdmin, refreshRatesAdmin, setManualRateAdmin, clearManualRateAdmin } from "@/fns/currency";
import { INDIAN_STATES } from "@/lib/india-states";
import { CURRENCIES, type SupportedCurrency } from "@/lib/currency";
import { RefreshCw, Edit2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  loader: async () => {
    const [settings, ratesData] = await Promise.all([getStoreSettings(), getExchangeRatesAdmin()]);
    return { settings, ratesData };
  },
  component: SettingsPage,
});

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const schema = z.object({
  legalName: z.string().min(1, "Required"),
  gstin: z.string().regex(GSTIN_RE, "Invalid GSTIN format (15 chars)").optional().or(z.literal("")),
  registeredAddress: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Must be 6 digits").optional().or(z.literal("")),
  phone: z.string().optional(),
  businessEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  state: z.string().min(1, "Required"),
  stateCode: z.string().min(1, "Required"),
  invoicePrefix: z.string().min(1).max(10),
  pricesIncludeGst: z.boolean(),
  codEnabled: z.boolean(),
  freeShippingAboveRs: z.number().min(0),
  shippingFeeRs: z.number().min(0),
  whatsappNumber: z.string().optional(),
  supportEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  referralEnabled: z.boolean().default(true),
  referralCoinReward: z.number().int().min(0).default(100),
  referralWelcomeDiscount: z.number().min(0).default(50),
  coinValuePaise: z.number().int().min(1).default(100),
  maxCoinsPctPerOrder: z.number().int().min(1).max(100).default(20),
  coinExpiryDays: z.number().int().min(1).default(365),
});
type FormData = z.infer<typeof schema>;

function SettingsField({
  label, name, type = "text", placeholder, hint, required, register, errors,
}: {
  label: string; name: keyof FormData; type?: string;
  placeholder?: string; hint?: string; required?: boolean;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) {
  return (
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
}

function ExchangeRatesSection({ initialRows, initialMap }: { initialRows: any[]; initialMap: Record<string, number> }) {
  const [rows, setRows] = useState(initialRows);
  const [ratesMap, setRatesMap] = useState(initialMap);
  const [refreshing, setRefreshing] = useState(false);
  const [editCurrency, setEditCurrency] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const reload = async () => {
    const data = await getExchangeRatesAdmin();
    setRows(data.rows);
    setRatesMap(data.ratesMap);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await refreshRatesAdmin();
      if (res.ok) { toast.success("Exchange rates refreshed"); await reload(); }
      else toast.error("Could not fetch live rates — kept existing");
    } catch (e: any) { toast.error(e?.message); }
    finally { setRefreshing(false); }
  };

  const handleSaveManual = async (currency: string) => {
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate <= 0) { toast.error("Enter a valid rate (> 0)"); return; }
    try {
      await setManualRateAdmin({ data: { currency, rate } });
      toast.success(`${currency} rate saved`);
      setEditCurrency(null);
      await reload();
    } catch (e: any) { toast.error(e?.message); }
  };

  const handleClearManual = async (currency: string) => {
    try {
      await clearManualRateAdmin({ data: { currency } });
      toast.success(`${currency} override cleared`);
      await reload();
    } catch (e: any) { toast.error(e?.message); }
  };

  const currencies = Object.keys(CURRENCIES).filter((c) => c !== "INR") as SupportedCurrency[];

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Exchange Rates</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh now
        </button>
      </div>
      <p className="text-xs text-gray-400">Rates are per 1 INR (how much foreign currency 1 rupee buys). Auto-refreshed every 24 h from open.er-api.com.</p>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-gray-500">
              <th className="pb-2 text-left">Currency</th>
              <th className="pb-2 text-right">Rate per ₹1</th>
              <th className="pb-2 text-right">Type</th>
              <th className="pb-2 text-right">Updated</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {currencies.map((cur) => {
              const row = rows.find((r: any) => r.currency === cur);
              const rate = ratesMap[cur];
              const isManual = row?.isManual ?? false;
              const updatedAt = row?.updatedAt ? new Date(row.updatedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
              return (
                <tr key={cur} className="border-b last:border-0">
                  <td className="py-2 font-medium">{cur} {CURRENCIES[cur].symbol}</td>
                  <td className="py-2 text-right font-mono">
                    {editCurrency === cur ? (
                      <input
                        autoFocus
                        type="number"
                        step="0.00001"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-28 rounded border border-gray-200 px-2 py-1 text-xs text-right outline-none focus:border-[var(--maroon)]"
                      />
                    ) : (
                      <span>{rate ? rate.toFixed(6) : "—"}</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {isManual ? (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Manual</span>
                    ) : (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Auto</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-xs text-gray-400">{updatedAt}</td>
                  <td className="py-2 text-right">
                    {editCurrency === cur ? (
                      <div className="flex items-center gap-1 justify-end">
                        <button type="button" onClick={() => handleSaveManual(cur)} className="text-xs text-white bg-[var(--maroon)] rounded px-2 py-0.5 hover:opacity-80">Save</button>
                        <button type="button" onClick={() => setEditCurrency(null)} className="text-xs text-gray-500 hover:text-gray-800">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        <button type="button" onClick={() => { setEditCurrency(cur); setEditValue(rate?.toFixed(6) ?? ""); }} className="p-1 text-gray-400 hover:text-[var(--maroon)]">
                          <Edit2 className="h-3 w-3" />
                        </button>
                        {isManual && (
                          <button type="button" onClick={() => handleClearManual(cur)} title="Clear manual override" className="p-1 text-amber-400 hover:text-amber-700">
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SettingsPage() {
  const { settings, ratesData } = Route.useLoaderData();
  const [saving, setSaving] = useState(false);

  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalName: settings?.legalName ?? "",
      gstin: settings?.gstin ?? "",
      registeredAddress: settings?.registeredAddress ?? "",
      addressLine1: settings?.addressLine1 ?? "",
      addressLine2: settings?.addressLine2 ?? "",
      city: settings?.city ?? "",
      pincode: settings?.pincode ?? "",
      phone: settings?.phone ?? "",
      businessEmail: settings?.businessEmail ?? "",
      state: settings?.state ?? "",
      stateCode: settings?.stateCode ?? "",
      invoicePrefix: settings?.invoicePrefix ?? "MUR",
      pricesIncludeGst: settings?.pricesIncludeGst ?? true,
      codEnabled: settings?.codEnabled ?? true,
      freeShippingAboveRs: (settings?.freeShippingAbove ?? 50000) / 100,
      shippingFeeRs: (settings?.shippingFee ?? 9900) / 100,
      whatsappNumber: settings?.whatsappNumber ?? "",
      supportEmail: settings?.supportEmail ?? "",
      referralEnabled: settings?.referralEnabled ?? true,
      referralCoinReward: settings?.referralCoinReward ?? 100,
      referralWelcomeDiscount: (settings?.referralWelcomeDiscount ?? 5000) / 100,
      coinValuePaise: settings?.coinValuePaise ?? 100,
      maxCoinsPctPerOrder: settings?.maxCoinsPctPerOrder ?? 20,
      coinExpiryDays: settings?.coinExpiryDays ?? 365,
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await saveStoreSettings({
        data: {
          ...data,
          gstin: data.gstin || undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          pincode: data.pincode || undefined,
          phone: data.phone || undefined,
          businessEmail: data.businessEmail || undefined,
          registeredAddress: data.registeredAddress || undefined,
          freeShippingAbove: Math.round(data.freeShippingAboveRs * 100),
          shippingFee: Math.round(data.shippingFeeRs * 100),
          whatsappNumber: data.whatsappNumber || undefined,
          supportEmail: data.supportEmail || undefined,
          referralWelcomeDiscount: Math.round(data.referralWelcomeDiscount * 100),
        },
      });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const watchedState = watch("state");
  const watchedGstin = watch("gstin");
  const watchedAddressLine1 = watch("addressLine1");
  const watchedCity = watch("city");
  const watchedPincode = watch("pincode");

  const missingInvoiceFields: string[] = [];
  if (!settings?.gstin && !watchedGstin) missingInvoiceFields.push("GSTIN");
  if (!settings?.addressLine1 && !watchedAddressLine1) missingInvoiceFields.push("Address Line 1");
  if (!settings?.city && !watchedCity) missingInvoiceFields.push("City");
  if (!settings?.pincode && !watchedPincode) missingInvoiceFields.push("Pincode");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">GST invoicing and store configuration</p>
      </div>

      {(!watchedState || missingInvoiceFields.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ <strong>Incomplete invoice details.</strong>{" "}
          {!watchedState
            ? "Business state is not set — GST type cannot be determined."
            : `Missing: ${missingInvoiceFields.join(", ")}. These will appear blank on tax invoices.`}
        </div>
      )}

      {/* Legal + Business Details */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Legal & Business Details</h2>
        <SettingsField label="Legal Name" name="legalName" required placeholder="Murlit Enterprises" register={register} errors={errors} />
        <SettingsField label="GSTIN" name="gstin" placeholder="08AAAAA0000A1Z5"
          hint="15-char GST number. First 2 digits must match your state's GST code (Rajasthan = 08)." register={register} errors={errors} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsField label="Address Line 1" name="addressLine1" placeholder="Shop / Building / Street" register={register} errors={errors} />
          <SettingsField label="Address Line 2" name="addressLine2" placeholder="Area / Locality (optional)" register={register} errors={errors} />
          <SettingsField label="City" name="city" placeholder="Jaipur" register={register} errors={errors} />
          <SettingsField label="Pincode" name="pincode" placeholder="302001" hint="6-digit PIN code" register={register} errors={errors} />
          <SettingsField label="Business Phone" name="phone" placeholder="+91 98765 43210" register={register} errors={errors} />
          <SettingsField label="Business Email" name="businessEmail" type="email" placeholder="accounts@murlit.com" register={register} errors={errors} />
        </div>
        <SettingsField label="Registered Address (legacy, used on invoices as fallback)" name="registeredAddress"
          placeholder="Full one-line address" hint="If Address Line 1/City/Pincode are filled, those are preferred on invoices." register={register} errors={errors} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business State (GST-registered) <span className="text-red-500">*</span>
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
            <p className="text-xs text-gray-400 mt-0.5">Used to determine CGST+SGST vs IGST on orders</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Code (auto)</label>
            <input
              {...register("stateCode")}
              readOnly
              className="w-full rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-0.5">2-letter ISO code, set automatically</p>
          </div>
        </div>
      </section>

      {/* Invoice */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Invoicing</h2>
        <SettingsField label="Invoice Prefix" name="invoicePrefix" placeholder="MUR" hint="e.g. MUR → MUR/2026-27/0001" register={register} errors={errors} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("pricesIncludeGst")} className="rounded" />
          Product prices include GST
        </label>
      </section>

      {/* Shipping */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Shipping & Payment</h2>
        <SettingsField label="Free Shipping Above (₹)" name="freeShippingAboveRs" type="number" placeholder="500" register={register} errors={errors} />
        <SettingsField label="Shipping Fee (₹)" name="shippingFeeRs" type="number" placeholder="99" register={register} errors={errors} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("codEnabled")} className="rounded" />
          Cash on Delivery (COD) enabled
        </label>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Contact</h2>
        <SettingsField label="WhatsApp Number" name="whatsappNumber" placeholder="+919876543210" register={register} errors={errors} />
        <SettingsField label="Support Email" name="supportEmail" type="email" placeholder="support@murlit.com" register={register} errors={errors} />
      </section>

      {/* Refer & Earn */}
      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Refer & Earn</h2>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("referralEnabled")} className="rounded" />
          Enable Referral Program & Coins
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsField label="Coins earned by referrer (on friend's first delivery)" name="referralCoinReward" type="number" placeholder="100" hint="e.g. 100 coins = ₹100" register={register} errors={errors} />
          <SettingsField label="Welcome discount for referred friend (₹)" name="referralWelcomeDiscount" type="number" placeholder="50" hint="Stored in paise internally — enter ₹ value" register={register} errors={errors} />
          <SettingsField label="Coin value (paise per coin)" name="coinValuePaise" type="number" placeholder="100" hint="100 = 1 coin = ₹1" register={register} errors={errors} />
          <SettingsField label="Max coins per order (%)" name="maxCoinsPctPerOrder" type="number" placeholder="20" hint="% of order value that can be paid in coins" register={register} errors={errors} />
          <SettingsField label="Coin expiry (days)" name="coinExpiryDays" type="number" placeholder="365" register={register} errors={errors} />
        </div>
      </section>

      <ExchangeRatesSection initialRows={ratesData.rows} initialMap={ratesData.ratesMap} />

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
