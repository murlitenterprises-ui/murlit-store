import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut, authClient } from "@/lib/auth-client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser } from "@/fns/auth";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/fns/addresses";
import { listMyOrders, cancelMyOrder } from "@/fns/orders";
import { getInvoice } from "@/fns/invoice";
import { getMyReferralInfo, getMyCoinLedger } from "@/fns/referral";
import { INDIAN_STATES } from "@/lib/india-states";
import { toast } from "sonner";
import { inrFromPaise } from "@/lib/format";
import { Download, Copy, Share2 } from "lucide-react";

export const Route = createFileRoute("/account")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { redirect: "/account" } });
    return { user };
  },
  component: AccountPage,
});

type Tab = "profile" | "addresses" | "orders" | "wishlist" | "referral" | "security";

// ─── Profile form ─────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

// ─── Password form ────────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type PasswordData = z.infer<typeof passwordSchema>;

// ─── Address form ─────────────────────────────────────────────────────────────
const addressSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  line1: z.string().min(1, "Required"),
  line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  stateCode: z.string().min(2),
  pincode: z.string().length(6, "Enter a 6-digit pincode"),
  isDefault: z.boolean().optional(),
});
type AddressData = z.infer<typeof addressSchema>;

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

function AccountPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  type MyOrder = Awaited<ReturnType<typeof listMyOrders>>[number];
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [referralInfo, setReferralInfo] = useState<Awaited<ReturnType<typeof getMyReferralInfo>> | null>(null);
  const [coinLedgerData, setCoinLedgerData] = useState<Awaited<ReturnType<typeof getMyCoinLedger>> | null>(null);

  // ─── Profile form ──────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: (user as any)?.phone ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name ?? "", phone: (user as any).phone ?? "" });
    }
  }, [user?.name]);

  const onProfileSubmit = async (data: ProfileData) => {
    try {
      await authClient.updateUser({ name: data.name, phone: data.phone } as any);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update profile");
    }
  };

  // ─── Password form ─────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const onPasswordSubmit = async (data: PasswordData) => {
    try {
      await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed");
      passwordForm.reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to change password");
    }
  };

  // ─── Addresses ─────────────────────────────────────────────────────────────
  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const rows = await listAddresses();
      setAddresses(rows as Address[]);
    } catch {
      /* ignore */
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === "addresses") loadAddresses();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const rows = await listMyOrders();
      setMyOrders(rows);
    } catch {
      /* ignore */
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") loadOrders();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "referral") return;
    getMyReferralInfo().then(setReferralInfo).catch(() => {});
    getMyCoinLedger({ data: { page: 1 } }).then(setCoinLedgerData).catch(() => {});
  }, [activeTab]);

  const handleCancelOrder = async (orderNumber: string) => {
    if (!confirm("Cancel this order?")) return;
    setCancellingOrderId(orderNumber);
    try {
      await cancelMyOrder({ data: { orderNumber } });
      toast.success("Order cancelled");
      await loadOrders();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleDownloadInvoice = async (orderNumber: string, invoiceNumber: string | null) => {
    setDownloadingInvoice(orderNumber);
    try {
      const b64 = await getInvoice({ data: { orderNumber } });
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber ?? orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const addressForm = useForm<AddressData>({ resolver: zodResolver(addressSchema) });

  const watchState = addressForm.watch("state");
  useEffect(() => {
    const s = INDIAN_STATES.find((x) => x.name === watchState);
    if (s) addressForm.setValue("stateCode", s.code);
  }, [watchState]);

  const openAddressForm = (addr?: Address) => {
    if (addr) {
      addressForm.reset({ ...addr, line2: addr.line2 ?? undefined });
      setEditingAddress(addr);
    } else {
      addressForm.reset({
        name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        stateCode: "",
        pincode: "",
        isDefault: false,
      });
      setEditingAddress(null);
    }
    setShowAddressForm(true);
  };

  const onAddressSubmit = async (data: AddressData) => {
    try {
      if (editingAddress) {
        await updateAddress({ data: { id: editingAddress.id, data } });
      } else {
        await createAddress({ data });
      }
      setShowAddressForm(false);
      toast.success(editingAddress ? "Address updated" : "Address added");
      await loadAddresses();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress({ data: { id } });
      await loadAddresses();
      toast.success("Address deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress({ data: { id } });
      await loadAddresses();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to set default");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "addresses", label: "Addresses" },
    { id: "orders", label: "My Orders" },
    { id: "wishlist", label: "Wishlist" },
    { id: "referral", label: "Refer & Earn" },
    { id: "security", label: "Security" },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-sage">
      <div className="container-x py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-maroon">My Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-sm border border-maroon px-4 py-2 text-sm font-semibold text-maroon transition hover:bg-maroon hover:text-on-dark"
          >
            Logout
          </button>
        </div>

        <div className="flex gap-8 flex-col lg:flex-row">
          {/* Sidebar tabs */}
          <aside className="lg:w-52 shrink-0">
            <nav className="space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full rounded-sm px-4 py-2.5 text-left text-sm font-medium transition ${
                    activeTab === t.id
                      ? "bg-maroon text-on-dark"
                      : "hover:bg-background text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Tab content */}
          <main className="flex-1 min-w-0">
            {/* ── Profile ── */}
            {activeTab === "profile" && (
              <div className="rounded-sm border bg-background p-6">
                <h2 className="font-display text-xl text-maroon mb-6">Profile Details</h2>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      {...profileForm.register("name")}
                      className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="mt-1 text-xs text-red-600">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      {...profileForm.register("phone")}
                      className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
                      placeholder="+91 9999999999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      value={user?.email ?? ""}
                      disabled
                      className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm text-muted-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-sm bg-royal px-6 py-2.5 text-sm font-semibold text-on-dark transition hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* ── Addresses ── */}
            {activeTab === "addresses" && (
              <div className="rounded-sm border bg-background p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-xl text-maroon">Saved Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => openAddressForm()}
                      className="rounded-sm bg-royal px-4 py-2 text-sm font-semibold text-on-dark hover:opacity-90"
                    >
                      + Add Address
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <div className="mb-6 rounded-sm border p-4 bg-sage">
                    <h3 className="font-semibold mb-4 text-maroon">
                      {editingAddress ? "Edit Address" : "New Address"}
                    </h3>
                    <form
                      onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {(
                        [
                          { field: "name" as const, label: "Full Name", col: 1 },
                          { field: "phone" as const, label: "Phone", col: 1 },
                          { field: "line1" as const, label: "Address Line 1", col: 2 },
                          { field: "line2" as const, label: "Address Line 2 (optional)", col: 2 },
                          { field: "city" as const, label: "City", col: 1 },
                          { field: "pincode" as const, label: "Pincode", col: 1 },
                        ] as const
                      ).map(({ field, label, col }) => (
                        <div key={field} className={col === 2 ? "sm:col-span-2" : ""}>
                          <label className="block text-sm font-medium mb-1">{label}</label>
                          <input
                            {...addressForm.register(field)}
                            className="w-full rounded-sm border bg-background px-3 py-2 text-sm outline-none focus:border-maroon"
                          />
                          {addressForm.formState.errors[field] && (
                            <p className="mt-1 text-xs text-red-600">
                              {addressForm.formState.errors[field]?.message}
                            </p>
                          )}
                        </div>
                      ))}

                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <select
                          {...addressForm.register("state")}
                          className="w-full rounded-sm border bg-background px-3 py-2 text-sm outline-none focus:border-maroon"
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        {addressForm.formState.errors.state && (
                          <p className="mt-1 text-xs text-red-600">
                            {addressForm.formState.errors.state.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">State Code</label>
                        <input
                          {...addressForm.register("stateCode")}
                          readOnly
                          className="w-full rounded-sm border bg-sage px-3 py-2 text-sm text-muted-foreground"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            {...addressForm.register("isDefault")}
                            className="rounded-sm"
                          />
                          Set as default address
                        </label>
                      </div>

                      <div className="sm:col-span-2 flex gap-3">
                        <button
                          type="submit"
                          className="rounded-sm bg-royal px-5 py-2 text-sm font-semibold text-on-dark hover:opacity-90"
                        >
                          {editingAddress ? "Update" : "Save Address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-sm border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-sage"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loadingAddresses ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`rounded-sm border p-4 text-sm ${addr.isDefault ? "border-maroon bg-ivory" : "bg-background"}`}
                      >
                        {addr.isDefault && (
                          <span className="mb-2 inline-block rounded-full bg-maroon px-2 py-0.5 text-[10px] font-bold uppercase text-on-dark">
                            Default
                          </span>
                        )}
                        <p className="font-semibold">{addr.name}</p>
                        <p className="text-muted-foreground">{addr.phone}</p>
                        <p className="text-muted-foreground">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => openAddressForm(addr)}
                            className="text-xs font-medium text-maroon hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              className="text-xs font-medium text-muted-foreground hover:underline"
                            >
                              Set default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Orders ── */}
            {activeTab === "orders" && (
              <div className="rounded-sm border bg-background p-6">
                <h2 className="font-display text-xl text-maroon mb-6">My Orders</h2>
                {loadingOrders ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No orders yet — they'll appear here once you place one.</p>
                    <Link to="/shop" className="rounded-sm bg-royal px-6 py-2.5 text-sm font-semibold text-on-dark hover:opacity-90">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((o) => {
                      const canCancel = o.paymentMethod === "cod" && o.status === "confirmed";
                      const canInvoice = ["confirmed", "packed", "shipped", "delivered"].includes(o.status);
                      const statusColor =
                        o.status === "delivered" ? "text-green-700 bg-green-50"
                        : o.status === "cancelled" ? "text-red-600 bg-red-50"
                        : o.status === "shipped" ? "text-blue-700 bg-blue-50"
                        : "text-amber-700 bg-amber-50";
                      return (
                        <div key={o.id} className="rounded-sm border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-maroon">{o.orderNumber}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>
                                {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                              </span>
                              {o.paymentStatus === "paid" ? (
                                <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-50">Paid</span>
                              ) : (
                                <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-amber-700 bg-amber-50">Payment Pending</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              {" · "}{o.itemCount} item{o.itemCount !== 1 ? "s" : ""}
                              {" · "}<span className="font-semibold text-foreground">{inrFromPaise(o.total)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to="/order/$orderNumber"
                              params={{ orderNumber: o.orderNumber }}
                              className="text-xs font-medium text-maroon hover:underline"
                            >
                              View Details
                            </Link>
                            {canInvoice && (
                              <button
                                onClick={() => handleDownloadInvoice(o.orderNumber, o.invoiceNumber)}
                                disabled={downloadingInvoice === o.orderNumber}
                                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-maroon disabled:opacity-50"
                              >
                                <Download size={12} />
                                {downloadingInvoice === o.orderNumber ? "…" : "Invoice"}
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => handleCancelOrder(o.orderNumber)}
                                disabled={cancellingOrderId === o.orderNumber}
                                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                              >
                                {cancellingOrderId === o.orderNumber ? "Cancelling…" : "Cancel"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Wishlist ── */}
            {activeTab === "wishlist" && (
              <div className="rounded-sm border bg-background p-6">
                <h2 className="font-display text-xl text-maroon mb-6">Wishlist</h2>
                <p className="text-muted-foreground">Wishlist coming soon.</p>
              </div>
            )}

            {/* ── Refer & Earn ── */}
            {activeTab === "referral" && (
              <div className="space-y-6">
                {/* Referral Card */}
                <div className="rounded-sm border bg-background p-6">
                  <h2 className="font-display text-xl text-maroon mb-1">Refer & Earn</h2>
                  <p className="text-sm text-muted-foreground mb-6">Share your link — your friend gets ₹{referralInfo ? (referralInfo.settings.referralWelcomeDiscount / 100).toFixed(0) : "50"} off, you earn {referralInfo?.settings.referralCoinReward ?? 100} coins when they order!</p>

                  {referralInfo ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Referral Code</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-sage rounded-sm px-4 py-2.5 font-mono text-lg font-bold text-maroon tracking-widest">{referralInfo.referralCode}</code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(referralInfo.referralLink); toast.success("Link copied!"); }}
                            className="flex items-center gap-1.5 rounded-sm bg-royal px-3 py-2.5 text-sm font-semibold text-on-dark hover:opacity-90"
                          >
                            <Copy size={14} /> Copy
                          </button>
                          {typeof navigator !== "undefined" && "share" in navigator && (
                            <button
                              onClick={() => (navigator as any).share({ title: "Murlit", text: "Shop on Murlit and get ₹50 off!", url: referralInfo.referralLink }).catch(() => {})}
                              className="flex items-center gap-1.5 rounded-sm border border-maroon px-3 py-2.5 text-sm font-semibold text-maroon hover:bg-maroon hover:text-on-dark transition"
                            >
                              <Share2 size={14} /> Share
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground break-all">{referralInfo.referralLink}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-sm bg-sage p-4 text-center">
                          <div className="text-3xl font-bold text-maroon">{referralInfo.referredCount}</div>
                          <div className="text-xs text-muted-foreground mt-1">Friends joined</div>
                        </div>
                        <div className="rounded-sm bg-sage p-4 text-center">
                          <div className="text-3xl font-bold text-maroon">{referralInfo.coinBalance}</div>
                          <div className="text-xs text-muted-foreground mt-1">Coin balance (₹{referralInfo.coinBalance})</div>
                        </div>
                      </div>

                      <div className="rounded-sm border border-dashed p-4 text-sm space-y-1 text-muted-foreground">
                        <p>📤 Share your link — friend signs up via your link</p>
                        <p>🛍️ Friend places their first order and gets ₹{(referralInfo.settings.referralWelcomeDiscount / 100).toFixed(0)} off</p>
                        <p>🚚 After their order is delivered, you earn {referralInfo.settings.referralCoinReward} coins</p>
                        <p>💰 Use coins at checkout (1 coin = ₹1, max {referralInfo.settings.maxCoinsPctPerOrder}% of order)</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  )}
                </div>

                {/* Coin History */}
                <div className="rounded-sm border bg-background p-6">
                  <h3 className="font-semibold mb-4 text-maroon">Coin History</h3>
                  {coinLedgerData?.rows.length === 0 && <p className="text-sm text-muted-foreground">No coin activity yet.</p>}
                  {coinLedgerData && coinLedgerData.rows.length > 0 && (
                    <div className="divide-y">
                      {coinLedgerData.rows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm">{row.reason}</p>
                            <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}{row.expiresAt ? ` · Expires ${new Date(row.expiresAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}</p>
                          </div>
                          <span className={`font-bold text-sm ${row.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                            {row.amount > 0 ? "+" : ""}{row.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <div className="rounded-sm border bg-background p-6">
                <h2 className="font-display text-xl text-maroon mb-6">Security</h2>

                <div className="max-w-md">
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Password</label>
                      <input
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none focus:border-maroon focus:bg-background"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">New Password</label>
                      <input
                        type="password"
                        {...passwordForm.register("newPassword")}
                        className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none focus:border-maroon focus:bg-background"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                        className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none focus:border-maroon focus:bg-background"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="rounded-sm bg-royal px-6 py-2.5 text-sm font-semibold text-on-dark transition hover:opacity-90"
                    >
                      Change Password
                    </button>
                  </form>

                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-semibold mb-3">Connected Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                      Google login linking will be available in a future update.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
