import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  downloadTemplate, previewImport, executeImport,
  generateErrorReport, type PreviewRow,
} from "@/fns/admin/import-export";
import { ChevronLeft, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/products/import")({
  component: ImportPage,
});

function b64ToBlob(b64: string, mime: string) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function downloadB64(b64: string, filename: string, mime: string) {
  const url = URL.createObjectURL(b64ToBlob(b64, mime));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Stage = "upload" | "preview" | "done";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorRows, setErrorRows] = useState<PreviewRow[]>([]);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const b64 = await downloadTemplate();
      downloadB64(b64, "murlit-product-template.xlsx", XLSX_MIME);
      toast.success("Template downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_100_000) {
      toast.error("File too large (max 2 MB)");
      return;
    }
    setFileName(file.name);
    setPreviewing(true);
    setStage("upload");

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data URL prefix
          const b64 = result.split(",")[1] ?? result;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { rows } = await previewImport({ data: { fileBase64, fileName: file.name } });
      setPreviewRows(rows);
      setStage("preview");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    const valid = previewRows.filter((r) => r.valid);
    if (!valid.length) return;
    setImporting(true);
    try {
      const res = await executeImport({ data: { rows: previewRows } });
      setResult(res);
      setErrorRows(previewRows.filter((r) => !r.valid));
      setStage("done");
      toast.success(`Import complete: ${res.created} created, ${res.updated} updated`);
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrors = async () => {
    try {
      const b64 = await generateErrorReport({
        data: {
          rows: errorRows.map((r) => ({
            rowNum: r.rowNum,
            sku: r.sku,
            name: r.name,
            errors: r.errors,
            valid: r.valid,
          })),
        },
      });
      downloadB64(b64, "import-errors.xlsx", XLSX_MIME);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const reset = () => {
    setStage("upload");
    setPreviewRows([]);
    setFileName("");
    setResult(null);
    setErrorRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validRows = previewRows.filter((r) => r.valid);
  const invalidRows = previewRows.filter((r) => !r.valid);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Import Products</h1>
        <button
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-gray-50 disabled:opacity-50"
          data-testid="download-template"
        >
          <Download size={13} />
          {downloadingTemplate ? "Downloading…" : "Download Template"}
        </button>
      </div>

      {/* Stage: upload */}
      {stage === "upload" && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col items-center gap-4">
          <FileSpreadsheet size={40} className="text-gray-300" />
          <div className="text-center">
            <p className="font-medium text-gray-800">Upload Excel or CSV file</p>
            <p className="text-sm text-gray-500 mt-1">
              .xlsx, .xls, or .csv · Max 2 MB · Max 1,000 rows
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            data-testid="file-input"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={previewing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--maroon)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
            data-testid="choose-file"
          >
            <Upload size={15} />
            {previewing ? "Parsing…" : "Choose File"}
          </button>
          {previewing && (
            <p className="text-sm text-gray-400 animate-pulse">Parsing and validating…</p>
          )}
        </div>
      )}

      {/* Stage: preview */}
      {stage === "preview" && (
        <>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
            <FileSpreadsheet size={20} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">
                {previewRows.length} rows total ·{" "}
                <span className="text-green-600 font-medium">{validRows.length} valid</span>
                {invalidRows.length > 0 && (
                  <span className="text-red-600 font-medium"> · {invalidRows.length} with errors</span>
                )}
              </p>
            </div>
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              data-testid="reset-upload"
            >
              <RefreshCw size={12} /> Change file
            </button>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-8">#</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">SKU</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Name</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Category</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Price</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row) => (
                    <tr
                      key={row.rowNum}
                      className={row.valid ? "" : "bg-red-50"}
                      data-testid={`preview-row-${row.rowNum}`}
                    >
                      <td className="px-3 py-2 text-gray-400">{row.rowNum}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-gray-800">{row.sku || "—"}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[180px] truncate">{row.name || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{row.categorySlug || "—"}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.priceRs !== null ? `₹${row.priceRs}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              row.isUpdate
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                            data-testid={row.isUpdate ? "badge-update" : "badge-new"}
                          >
                            {row.isUpdate ? "Update" : "New"}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700"
                            data-testid="badge-error"
                          >
                            <AlertCircle size={10} /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-red-600 text-xs max-w-[280px]">
                        {row.errors.length > 0 && (
                          <ul className="space-y-0.5">
                            {row.errors.map((e, i) => (
                              <li key={i}>• {e}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex items-center gap-3">
            {validRows.length > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--maroon)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
                data-testid="import-button"
              >
                {importing ? "Importing…" : `Import ${validRows.length} valid row${validRows.length !== 1 ? "s" : ""}`}
              </button>
            )}
            {invalidRows.length > 0 && (
              <p className="text-sm text-red-600">
                {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} with errors will be skipped
              </p>
            )}
          </div>
        </>
      )}

      {/* Stage: done */}
      {stage === "done" && result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-600" />
            <h2 className="font-semibold text-gray-800">Import Complete</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Created", value: result.created, color: "text-green-600" },
              { label: "Updated", value: result.updated, color: "text-amber-600" },
              { label: "Skipped (errors)", value: result.skipped, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${color}`} data-testid={`result-${label.toLowerCase().split(" ")[0]}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Warnings:</p>
              <ul className="text-xs text-amber-700 space-y-0.5">
                {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <Link
              to="/admin/products"
              className="px-4 py-2 text-sm font-semibold bg-[var(--maroon)] text-white rounded-md hover:opacity-90"
              data-testid="view-products-link"
            >
              View Products
            </Link>
            {errorRows.length > 0 && (
              <button
                onClick={handleDownloadErrors}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-md hover:bg-gray-50"
                data-testid="download-errors"
              >
                <Download size={13} /> Download Error Report
              </button>
            )}
            <button
              onClick={reset}
              className="px-3 py-2 text-sm border rounded-md text-gray-600 hover:bg-gray-50"
              data-testid="import-another"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
