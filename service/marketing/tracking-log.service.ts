import "server-only";

import connectDB from "@/lib/db";
import TrackingLog, { type ITrackingLog } from "@/models/TrackingLog";
import type {
  TrackingLogEntry,
  TrackingLogsSummary,
  TrackingLogStatus,
  TrackingPlatform,
} from "@/types/marketing";

export interface RecordTrackingLogInput {
  eventName: string;
  eventId: string;
  source: "client" | "server";
  platform: TrackingPlatform;
  status: TrackingLogStatus;
  orderId?: string;
  value?: number;
  currency?: string;
  itemCount?: number;
  httpStatus?: number;
  errorMessage?: string;
  metaTraceId?: string;
  consentState?: {
    analytics: boolean;
    marketing: boolean;
  };
  path?: string;
}

/**
 * Persists a sanitized tracking log entry. Never throws to callers
 * so analytics logging cannot disrupt checkout or storefront requests.
 */
export async function recordTrackingLog(
  input: RecordTrackingLogInput
): Promise<void> {
  try {
    await connectDB();

    const doc: ITrackingLog = {
      eventName: input.eventName.slice(0, 64),
      eventId: input.eventId.slice(0, 128),
      source: input.source,
      platform: input.platform,
      status: input.status,
      ...(input.orderId ? { orderId: input.orderId.slice(0, 100) } : {}),
      ...(typeof input.value === "number" && Number.isFinite(input.value)
        ? { value: Math.max(0, input.value) }
        : {}),
      ...(input.currency ? { currency: input.currency.slice(0, 8) } : {}),
      ...(typeof input.itemCount === "number" && Number.isFinite(input.itemCount)
        ? { itemCount: Math.max(0, Math.floor(input.itemCount)) }
        : {}),
      ...(typeof input.httpStatus === "number"
        ? { httpStatus: input.httpStatus }
        : {}),
      ...(input.errorMessage
        ? { errorMessage: input.errorMessage.slice(0, 500) }
        : {}),
      ...(input.metaTraceId
        ? { metaTraceId: input.metaTraceId.slice(0, 120) }
        : {}),
      ...(input.consentState ? { consentState: input.consentState } : {}),
      ...(input.path ? { path: input.path.slice(0, 500) } : {}),
    };

    await TrackingLog.create(doc);
  } catch (error) {
    console.error("Record Tracking Log Error:", error);
  }
}

/**
 * Checks whether an event (by eventId or orderId) has already been successfully sent
 * to the target platform to prevent duplicate server-side conversions.
 */
export async function hasSuccessfulServerEvent(params: {
  platform: TrackingPlatform;
  eventName: string;
  eventId?: string;
  orderId?: string;
}): Promise<boolean> {
  try {
    await connectDB();

    const orConditions: Record<string, unknown>[] = [];
    if (params.eventId) {
      orConditions.push({ eventId: params.eventId });
    }
    if (params.orderId) {
      orConditions.push({ orderId: params.orderId });
    }

    if (orConditions.length === 0) return false;

    const existing = await TrackingLog.findOne({
      platform: params.platform,
      eventName: params.eventName,
      status: "success",
      $or: orConditions,
    })
      .select("_id")
      .lean();

    return Boolean(existing);
  } catch (error) {
    console.error("Check Duplicate Tracking Event Error:", error);
    return false;
  }
}

export interface TrackingLogsQuery {
  page?: number;
  limit?: number;
  platform?: string;
  status?: string;
  eventName?: string;
}

export async function getTrackingLogs(query: TrackingLogsQuery = {}): Promise<{
  logs: TrackingLogEntry[];
  summary: TrackingLogsSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  await connectDB();

  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(query.limit ?? 25)));
  const skip = (page - 1) * limit;

  const ALLOWED_PLATFORMS = new Set(["meta_capi", "ga4", "gtm", "google_ads"]);
  const ALLOWED_STATUSES = new Set(["success", "failed", "skipped"]);

  const filter: Record<string, unknown> = {};
  if (query.platform && ALLOWED_PLATFORMS.has(query.platform)) {
    filter.platform = query.platform;
  }
  if (query.status && ALLOWED_STATUSES.has(query.status)) {
    filter.status = query.status;
  }
  if (query.eventName && query.eventName !== "all") {
    filter.eventName = query.eventName.trim().slice(0, 80);
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalFiltered,
    rawLogs,
    totalAll,
    successCount,
    failedCount,
    skippedCount,
    recentPurchases,
    last24HoursErrors,
  ] = await Promise.all([
    TrackingLog.countDocuments(filter),
    TrackingLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TrackingLog.countDocuments({}),
    TrackingLog.countDocuments({ status: "success" }),
    TrackingLog.countDocuments({ status: "failed" }),
    TrackingLog.countDocuments({ status: "skipped" }),
    TrackingLog.countDocuments({
      eventName: { $in: ["purchase", "Purchase"] },
      status: "success",
    }),
    TrackingLog.countDocuments({
      status: "failed",
      createdAt: { $gte: since24h },
    }),
  ]);

  const logs: TrackingLogEntry[] = rawLogs.map((row) => ({
    _id: String(row._id),
    eventName: row.eventName,
    eventId: row.eventId,
    source: row.source,
    platform: row.platform,
    status: row.status,
    orderId: row.orderId,
    value: row.value,
    currency: row.currency,
    itemCount: row.itemCount,
    httpStatus: row.httpStatus,
    errorMessage: row.errorMessage,
    metaTraceId: row.metaTraceId,
    consentState: row.consentState,
    path: row.path,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
  }));

  return {
    logs,
    summary: {
      total: totalAll,
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
      recentPurchases,
      last24HoursErrors,
    },
    pagination: {
      page,
      limit,
      total: totalFiltered,
      totalPages: Math.max(1, Math.ceil(totalFiltered / limit)),
    },
  };
}

export async function clearTrackingLogs(statusFilter?: string): Promise<number> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (
    statusFilter === "failed" ||
    statusFilter === "skipped" ||
    statusFilter === "success"
  ) {
    filter.status = statusFilter;
  }

  const result = await TrackingLog.deleteMany(filter);
  return result.deletedCount ?? 0;
}
