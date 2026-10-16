import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardStats } from "@/fns/admin/dashboard";
import { inrFromPaise } from "@/lib/format";
import { Package, ToggleRight, AlertTriangle, Users, FolderOpen, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  loader: () => getDashboardStats(),
  component: Dashboard,
});

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex gap-4 items-start">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function Dashboard() {
  const stats = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Products" value={stats.totalProducts}
          icon={Package} color="bg-[var(--maroon)]"
        />
        <StatCard
          label="Active Products" value={stats.activeProducts}
          icon={ToggleRight} color="bg-green-500"
        />
        <StatCard
          label="Out of Stock" value={stats.outOfStock}
          icon={AlertTriangle} color="bg-amber-500"
        />
        <StatCard
          label="Total Customers" value={stats.totalCustomers}
          icon={Users} color="bg-blue-500"
        />
        <StatCard
          label="Active Categories" value={stats.totalCategories}
          icon={FolderOpen} color="bg-purple-500"
        />
        <StatCard
          label="Total Revenue" value="₹0"
          icon={TrendingUp} color="bg-gray-400"
          sub="Available after Phase 5"
        />
      </div>

      {/* Orders placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Recent Orders</h2>
        <p className="text-sm text-gray-400">Order management will be available in Phase 5.</p>
      </div>

      {/* Low stock */}
      {stats.lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-200 p-5">
          <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Low Stock ({stats.lowStockItems.length} item{stats.lowStockItems.length !== 1 ? "s" : ""})
          </h2>
          <ul className="divide-y divide-gray-100">
            {stats.lowStockItems.map((item) => (
              <li key={item.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="text-amber-600 font-medium">{item.stock} left</span>
              </li>
            ))}
          </ul>
          <Link
            to="/admin/products"
            className="mt-3 inline-block text-xs text-[var(--maroon)] hover:underline"
          >
            Manage products →
          </Link>
        </div>
      )}
    </div>
  );
}
