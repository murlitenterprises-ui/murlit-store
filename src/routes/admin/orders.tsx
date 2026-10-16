import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { listOrders } from "@/fns/admin/orders";
import { inrFromPaise } from "@/lib/format";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUS_OPTIONS = ["", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_METHOD_OPTIONS = ["", "cod", "razorpay"];
const PAYMENT_STATUS_OPTIONS = ["", "pending", "paid", "failed", "refunded"];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    confirmed: "bg-amber-100 text-amber-700",
    packed: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    refunded: "bg-pink-100 text-pink-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listOrders>> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const data = await listOrders({
        data: { search, status, paymentMethod, paymentStatus, dateFrom, dateTo, page: p },
      });
      setResult(data);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useState(() => { load(1); });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1);
  };

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">{result ? `${result.total} total orders` : "Loading…"}</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, email, phone…"
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-md outline-none focus:border-[var(--maroon)]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-[var(--maroon)] text-white rounded-md hover:opacity-90"
          >
            Search
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
          >
            <option value="">All Methods</option>
            <option value="cod">COD</option>
            <option value="razorpay">Razorpay</option>
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
            title="To date"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : !result || result.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{row.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{row.email}<br /><span className="text-xs text-gray-400">{row.phone}</span></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-semibold">{inrFromPaise(row.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(row.status)}`}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {row.paymentMethod.toUpperCase()}
                      {row.paymentStatus === "paid" ? " · Paid" : " · Pending"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: row.id }}
                        className="text-xs font-medium text-[var(--maroon)] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {result && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} · {result.total} orders
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded border text-gray-600 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded border text-gray-600 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
