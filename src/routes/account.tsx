import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession, signOut, authClient } from "@/lib/auth-client";
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
import { INDIAN_STATES } from "@/lib/india-states";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { redirect: "/account" } });
  },
  component: AccountPage,
});

type Tab = "profile" | "addresses" | "orders" | "wishlist" | "security";

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
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const user = session?.user;

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
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No orders yet — they'll appear here once you place one.
                  </p>
                  <Link
                    to="/shop"
                    className="rounded-sm bg-royal px-6 py-2.5 text-sm font-semibold text-on-dark hover:opacity-90"
                  >
                    Start Shopping
                  </Link>
                </div>
              </div>
            )}

            {/* ── Wishlist ── */}
            {activeTab === "wishlist" && (
              <div className="rounded-sm border bg-background p-6">
                <h2 className="font-display text-xl text-maroon mb-6">Wishlist</h2>
                <p className="text-muted-foreground">Wishlist coming soon.</p>
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
