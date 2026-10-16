import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { listEnquiries, updateEnquiryStatus } from "@/fns/admin/enquiries";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/enquiries")({
  component: AdminEnquiries,
});

const TYPE_LABELS: Record<string, string> = { contact: "Contact", bulk: "Bulk/B2B", custom: "Custom Order" };
const STATUS_OPTIONS = ["", "new", "in_progress", "closed"];
const STATUS_LABELS: Record<string, string> = { new: "New", in_progress: "In Progress", closed: "Closed" };
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-500",
};

function AdminEnquiries() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listEnquiries>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const data = await listEnquiries({ data: { type: typeFilter, status: statusFilter, page: p } });
      setResult(data);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useState(() => { load(1); });

  const handleStatus = async (id: string, status: "new" | "in_progress" | "closed") => {
    try {
      await updateEnquiryStatus({ data: { id, status } });
      await load(page);
      toast.success("Status updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Enquiries</h1>
        <p className="text-sm text-gray-500">{result ? `${result.total} total` : "Loading…"}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white rounded-lg border border-gray-200 p-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); load(1); }}
          className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
        >
          <option value="">All Types</option>
          <option value="contact">Contact</option>
          <option value="bulk">Bulk/B2B</option>
          <option value="custom">Custom Order</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); load(1); }}
          className="text-sm border rounded-md px-2 py-1.5 outline-none focus:border-[var(--maroon)]"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : !result || result.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No enquiries found.</div>
        ) : result.rows.map((row) => (
          <div key={row.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--maroon)]">
                    {TYPE_LABELS[row.type] ?? row.type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[row.status]}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="font-semibold text-sm mt-1">{row.name}</p>
                <p className="text-xs text-gray-500">{row.email ?? ""} {row.phone ? `· ${row.phone}` : ""}</p>
                {expanded === row.id && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.message}</p>
                    {row.details && Object.entries(row.details as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                      <p key={k} className="text-xs text-gray-500 capitalize">{k}: {v}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  className="text-xs font-medium text-[var(--maroon)] hover:underline"
                >
                  {expanded === row.id ? "Hide" : "View"}
                </button>
                <select
                  value={row.status}
                  onChange={(e) => handleStatus(row.id, e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 outline-none focus:border-[var(--maroon)]"
                >
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {result && totalPages > 1 && (
        <div className="flex items-center justify-between">
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
  );
}
