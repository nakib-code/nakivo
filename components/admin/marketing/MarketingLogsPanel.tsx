"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBDT } from "@/lib/currency";
import {
  TRACKING_EVENT_NAMES,
  type TrackingLogEntry,
  type TrackingLogsSummary,
} from "@/types/marketing";

interface LogsApiResponse {
  success: boolean;
  message?: string;
  data?: {
    logs: TrackingLogEntry[];
    summary: TrackingLogsSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const DEFAULT_SUMMARY: TrackingLogsSummary = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  recentPurchases: 0,
  last24HoursErrors: 0,
};

export default function MarketingLogsPanel() {
  const [logs, setLogs] = useState<TrackingLogEntry[]>([]);
  const [summary, setSummary] = useState<TrackingLogsSummary>(DEFAULT_SUMMARY);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [eventName, setEventName] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          platform,
          status,
          eventName,
        });

        const res = await fetch(
          `/api/admin/marketing/logs?${params.toString()}`,
          { cache: "no-store" }
        );
        const json = (await res.json().catch(() => null)) as
          | LogsApiResponse
          | null;

        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message || "Failed to load tracking logs");
        }

        if (active) {
          setLogs(json.data.logs);
          setSummary(json.data.summary);
          setTotalPages(json.data.pagination.totalPages);
          setTotal(json.data.pagination.total);
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof Error ? err.message : "Unable to load tracking logs";
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [page, platform, status, eventName, reloadTick]);

  const refreshLogs = () => setReloadTick((t) => t + 1);

  async function handleClearLogs() {
    try {
      setClearing(true);
      const query = status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/admin/marketing/logs${query}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to clear tracking logs");
      }

      toast.success(json.message || "Tracking logs cleared");
      setClearDialogOpen(false);
      setPage(1);
      refreshLogs();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to clear tracking logs"
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Tracking Logs &amp; Monitoring
          </h2>
          <p className="text-xs text-slate-500">
            Inspect server-side conversion deliveries, integration errors, and
            deduplication status. Personal data is never stored in logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshLogs}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={clearing || summary.total === 0}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Total Logged Events"
          value={summary.total}
          icon={<Activity className="h-4 w-4 text-slate-600" />}
        />
        <SummaryCard
          label="Delivered Successfully"
          value={summary.success}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          accent="text-emerald-700"
        />
        <SummaryCard
          label="Failed (24h Errors)"
          value={`${summary.failed} (${summary.last24HoursErrors})`}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          accent={summary.failed > 0 ? "text-red-600" : "text-slate-900"}
        />
        <SummaryCard
          label="Tracked Purchases"
          value={summary.recentPurchases}
          icon={<ShoppingBag className="h-4 w-4 text-blue-600" />}
          accent="text-blue-700"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3.5">
        <select
          aria-label="Filter by platform"
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-black"
        >
          <option value="all">All Platforms</option>
          <option value="meta_capi">Meta Conversions API</option>
          <option value="meta_pixel">Meta Pixel</option>
          <option value="ga4">Google Analytics 4</option>
          <option value="gtm">Google Tag Manager</option>
          <option value="google_ads">Google Ads</option>
          <option value="system">System</option>
        </select>

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-black"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped / Deduplicated</option>
        </select>

        <select
          aria-label="Filter by event name"
          value={eventName}
          onChange={(e) => {
            setEventName(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-black"
        >
          <option value="all">All Events</option>
          {TRACKING_EVENT_NAMES.map((evt) => (
            <option key={evt} value={evt}>
              {evt}
            </option>
          ))}
        </select>

        <span className="ml-auto text-xs text-slate-500">
          {total} matching {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <XCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={refreshLogs}
            >
              Try Again
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No tracking logs recorded yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Server-side conversion events, test dispatches, and integration
              errors will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Value / Order</th>
                  <th className="px-4 py-3">Event ID / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                      {log.eventName}
                      <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                        {log.source}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatPlatform(log.platform)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {typeof log.value === "number" ? (
                        <span className="font-semibold">
                          {log.currency === "BDT" || !log.currency
                            ? formatBDT(log.value)
                            : `${log.currency} ${log.value}`}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {log.orderId && (
                        <div className="text-[10px] text-slate-500">
                          Order: {log.orderId.slice(-8)}
                        </div>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-mono text-[11px] text-slate-600">
                        {log.eventId}
                      </p>
                      {log.errorMessage && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-red-600">
                          {log.httpStatus ? `[HTTP ${log.httpStatus}] ` : ""}
                          {log.errorMessage}
                        </p>
                      )}
                      {log.metaTraceId && (
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          Trace: {log.metaTraceId}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Tracking Logs</DialogTitle>
            <DialogDescription>
              {status !== "all"
                ? `This will permanently delete all "${status}" tracking log entries. This action cannot be undone.`
                : "This will permanently delete all stored tracking logs. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setClearDialogOpen(false)}
              disabled={clearing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleClearLogs()}
              disabled={clearing}
            >
              {clearing ? "Clearing..." : "Confirm Clear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent = "text-slate-900",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: TrackingLogEntry["status"] }) {
  if (status === "success") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Success
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
      Skipped
    </Badge>
  );
}

function formatPlatform(platform: string): string {
  switch (platform) {
    case "meta_capi":
      return "Meta CAPI";
    case "meta_pixel":
      return "Meta Pixel";
    case "ga4":
      return "GA4";
    case "gtm":
      return "GTM";
    case "google_ads":
      return "Google Ads";
    default:
      return "System";
  }
}
