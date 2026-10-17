import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { listCustomers, getCustomerDetail } from "@/fns/admin/customers";
import { inrFromPaise } from "@/lib/format";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-amber-100 text-amber-700",
  packed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listCustomers>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getCustomerDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const data = await listCustomers({ data: { search: q, page: p } });
      setResult(data);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useState(() => { load(1); });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1, search);
  };

  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const d = await getCustomerDetail({ data: { userId } });
      setDetail(d);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  if (detail) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{detail.name}</h1>
            <p className="text-sm text-gray-500">{detail.email}{detail.phone ? ` · ${detail.phone}` : ""}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-gray-500">Joined</div>
            <div className="font-semibold">{new Date(detail.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-gray-500">Total Orders</div>
            <div className="font-semibold">{detail.orders.length}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">Orders</div>
          {detail.orders.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-400">No orders yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {detail.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                    <span className="ml-2 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{inrFromPaise(o.total)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {o.status}
                    </span>
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="text-xs text-[var(--maroon)] hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {detail.addresses.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium text-sm mb-3">Saved Addresses</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {detail.addresses.map((a) => (
                <div key={a.id} className="rounded border p-3 text-xs text-gray-600">
                  <p className="font-semibold">{a.name}</p>
                  <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                  <p>{a.city}, {a.state} – {a.pincode}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">{result ? `${result.total} total` : "Loading…"}</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md outline-none focus:border-[var(--maroon)]"
          />
        </div>
        <button type="submit" className="px-4 py-2 text-sm font-medium bg-[var(--maroon)] text-white rounded-md hover:opacity-90">
          Search
        </button>
      </form>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading || detailLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : !result || result.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Orders</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Spent</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{row.orderCount}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inrFromPaise(row.totalSpent)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(row.id)} className="text-xs font-medium text-[var(--maroon)] hover:underline">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="p-1.5 rounded border text-gray-600 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded border text-gray-600 disabled:opacity-30 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
