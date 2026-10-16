import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardStats } from "@/fns/admin/dashboard";
import { inrFromPaise } from "@/lib/format";
import { Package, ToggleRight, AlertTriangle, Users, FolderOpen, TrendingUp, ShoppingCart, IndianRupee } from "lucide-react";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", packed: "Packed",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  confirmed: "bg-amber-100 text-amber-700",
  packed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  refunded: "bg-pink-100 text-pink-700",
};

function Dashboard() {
  const stats = Route.useLoaderData();
  const totalOrders = Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your store</p>
      </div>

      {/* Sales cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales" value={inrFromPaise(stats.todaySales)}
          icon={IndianRupee} color="bg-[var(--maroon)]"
        />
        <StatCard
          label="This Month's Sales" value={inrFromPaise(stats.monthSales)}
          icon={TrendingUp} color="bg-green-600"
        />
        <StatCard
          label="Total Orders" value={totalOrders}
          icon={ShoppingCart} color="bg-blue-500"
        />
        <StatCard
          label="Total Customers" value={stats.totalCustomers}
          icon={Users} color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Active Products" value={stats.activeProducts}
          icon={ToggleRight} color="bg-teal-500"
          sub={`${stats.outOfStock} out of stock`}
        />
        <StatCard
          label="Total Products" value={stats.totalProducts}
          icon={Package} color="bg-gray-500"
        />
        <StatCard
          label="Active Categories" value={stats.totalCategories}
          icon={FolderOpen} color="bg-orange-500"
        />
      </div>

      {/* Orders by status */}
      {totalOrders > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Orders by Status</h2>
            <Link to="/admin/orders" className="text-xs text-[var(--maroon)] hover:underline">View all →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.ordersByStatus).map(([status, n]) => (
              <span key={status} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[status] ?? status}: {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Latest orders */}
      {stats.latestOrders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Latest Orders</h2>
            <Link to="/admin/orders" className="text-xs text-[var(--maroon)] hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.latestOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50">
                <div>
                  <span className="font-mono font-semibold text-xs text-gray-800">{o.orderNumber}</span>
                  <span className="ml-2 text-gray-400 text-xs">{o.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{inrFromPaise(o.total)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? ""}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: o.id }}
                    className="text-xs text-[var(--maroon)] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
