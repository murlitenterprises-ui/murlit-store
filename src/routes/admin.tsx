import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/fns/auth";
import { signOut } from "@/lib/auth-client";
import { useState } from "react";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users,
  MessageSquare, Settings, ExternalLink, LogOut, Menu, X, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { redirect: "/admin" } });
    if ((user as any).role !== "admin") throw redirect({ to: "/" });
    return { adminUser: user };
  },
  // loader return value is dehydrated by TanStack Start and available via useLoaderData()
  // beforeLoad context is NOT dehydrated — using loader is the correct pattern
  loader: ({ context }) => ({ adminUser: (context as any).adminUser }),
  component: AdminLayout,
});

const navItems = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products" as const, label: "Products", icon: Package },
  { to: "/admin/categories" as const, label: "Categories", icon: FolderOpen },
  { to: "/admin/orders" as const, label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers" as const, label: "Customers", icon: Users },
  { to: "/admin/enquiries" as const, label: "Enquiries", icon: MessageSquare },
  { to: "/admin/settings" as const, label: "Settings", icon: Settings },
];

function AdminLayout() {
  // loader data is dehydrated by TanStack Start — available immediately on client hydration
  const { adminUser } = Route.useLoaderData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // beforeLoad guarantees only admins reach this component; no null-check needed

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="font-display text-xl text-white tracking-wide">Murlit Admin</div>
        <div className="text-xs text-white/50 mt-0.5 truncate">{adminUser?.email}</div>
      </div>

      <ul className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map(({ to, label, icon: Icon, exact, soon }) => (
          <li key={to}>
            {soon ? (
              <span className="flex items-center gap-3 px-3 py-2.5 rounded text-white/30 text-sm cursor-not-allowed">
                <Icon size={16} />
                <span>{label}</span>
                <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
              </span>
            ) : (
              <Link
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                  isActive(to, exact)
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
                {isActive(to, exact) && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-white/10 px-2 py-3 space-y-0.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink size={16} />
          View Store
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f5f0]">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{ background: "var(--maroon)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 z-50" style={{ background: "var(--maroon)" }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center h-12 px-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-3 text-gray-500 hover:text-gray-800"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {navItems.find((n) => isActive(n.to, n.exact))?.label ?? "Admin"}
          </span>
          <span className="ml-auto text-xs text-gray-400 hidden sm:block">{adminUser?.name}</span>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
